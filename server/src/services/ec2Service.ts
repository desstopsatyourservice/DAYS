import {
  EC2Client,
  DescribeInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  DescribeImagesCommand,
  RunInstancesCommand,
  _InstanceType,
  TerminateInstancesCommand,
  AuthorizeSecurityGroupIngressCommand,
} from "@aws-sdk/client-ec2";
import mysql, { createPool } from "mysql2";
import { GeneratePassword } from "../helpers/string";

const pricingTiers = ["Basic", "Standard", "Premium"];

const ec2Client = new EC2Client({
  region: process.env.AWS_REGION ?? "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "wrong-key",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "wrong-key",
  },
});

const guacDb = createPool({
  host: process.env.MYSQL_HOSTNAME ?? "",
  user: process.env.MYSQL_USER ?? "guacamole_user",
  password: process.env.MYSQL_PASSWORD ?? "your_password",
  port: Number(process.env.MYSQL_PORT) ?? 3006,
  database: process.env.MYSQL_DATABASE ?? "guacamole_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}).promise();

export async function listAmis() {
  const amis = await Promise.all([
    fetchLatestAmi("amazon", "amzn2-ami-hvm-*-x86_64-gp2", "Amazon Linux 2"),
    fetchLatestAmi(
      "aws-marketplace",
      "*GUI Desktop*",
      "Amazon Linux 2 GUI Desktop (RDP)"
    ),
    fetchLatestAmi(
      "099720109477",
      "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*",
      "Ubuntu 22.04 LTS"
    ),
    fetchLatestAmi(
      "aws-marketplace",
      "*Ubuntu Desktop*RDP*",
      "Ubuntu Desktop (RDP)"
    ),
    fetchLatestAmi(
      "amazon",
      "Windows_Server-2022-English-Full-Base-*",
      "Windows Server 2022"
    ),
  ]);

  return amis.filter((a) => a !== null);
}

export async function listInstances() {
  const command = new DescribeInstancesCommand({});
  const data = await ec2Client.send(command);

  return data.Reservations?.flatMap((r) =>
    r.Instances?.map((i) => {
      let instanceType = i.InstanceType?.startsWith("t3")
        ? i.InstanceType
        : `t3.${i.InstanceType?.split(".")[1]}`;

      let tier: string;
      switch (instanceType?.split(".")[1]) {
        case "nano":
        case "micro":
        case "small":
          tier = "Basic";
          break;
        case "medium":
          tier = "Standard";
          break;
        case "large":
        case "xlarge":
        case "2xlarge":
        case "4xlarge":
        case "8xlarge":
          tier = "Premium";
          break;
        default:
          tier = "Standard";
      }

      return {
        id: i.InstanceId,
        name: i.Tags?.find((t) => t.Key === "Name")?.Value || "(no name)",
        type: instanceType,
        tier,
        amiId: i.ImageId,
        state: i.State?.Name,
      };
    })
  );
}

export async function addInstance(
  amiId: string,
  keyName: string,
  pricingTier: "Basic" | "Standard" | "Premium",
  protocol?: "rdp" | "ssh" | "vnc"
) {
  try {
    const tierToSize = {
      Basic: "t3.micro",
      Standard: "t3.medium",
      Premium: "t3a.large",
    } as const;

    const instanceType = tierToSize[pricingTier];
    const amis = await listAmis();
    const ami = amis.find((x) => x.id === amiId);

    if (!protocol) {
      protocol =
        ami?.name.includes("Windows") || ami?.name.includes("RDP")
          ? "rdp"
          : "ssh";
    }

    const defaultPassword = GeneratePassword();
    let userDataScript = "";

    const isWindows = ami?.name.includes("Windows");
    const isUbuntu = ami?.name.includes("Ubuntu");
    const isAmazonLinux = ami?.name.includes("Amazon Linux");

    if (protocol === "rdp") {
      if (isWindows) {
        userDataScript = `
<powershell>
net user Administrator "${defaultPassword}"
</powershell>
`;
      } else if (isUbuntu) {
        userDataScript = `
#cloud-config
package_update: true
runcmd:
  - apt-get update
  - DEBIAN_FRONTEND=noninteractive apt-get install -y xrdp xfce4
  - systemctl enable xrdp
  - systemctl restart xrdp
  - echo "ubuntu:${defaultPassword}" | chpasswd
  - echo xfce4-session > /home/ubuntu/.xsession
  - chown ubuntu:ubuntu /home/ubuntu/.xsession
`;
      } else if (isAmazonLinux) {
        userDataScript = `
#cloud-config
package_update: true
runcmd:
  - yum install -y epel-release
  - yum install -y xrdp tigervnc-server
  - systemctl enable xrdp
  - systemctl start xrdp
  - echo "ec2-user:${defaultPassword}" | chpasswd
  - sed -i 's/^PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
  - systemctl restart sshd
  - echo "exec /usr/bin/xterm" > /home/ec2-user/.Xclients
  - chmod +x /home/ec2-user/.Xclients
  - chown ec2-user:ec2-user /home/ec2-user/.Xclients
`;
      }
    } else if (protocol === "ssh") {
      const username = isUbuntu ? "ubuntu" : "ec2-user";
      userDataScript = `
#cloud-config
ssh_pwauth: true
chpasswd:
  list: |
    ${username}:${defaultPassword}
  expire: false
`;
    }

    const runCommand = new RunInstancesCommand({
      ImageId: amiId,
      InstanceType: instanceType,
      MinCount: 1,
      MaxCount: 1,
      KeyName: "days-keypair",
      UserData: Buffer.from(userDataScript).toString("base64"),
      TagSpecifications: [
        {
          ResourceType: "instance",
          Tags: [
            { Key: "Name", Value: keyName },
            { Key: "PricingTier", Value: pricingTier },
          ],
        },
      ],
    });

    const runResponse = await ec2Client.send(runCommand);
    const instance = runResponse.Instances?.[0];
    if (!instance || !instance.InstanceId)
      throw new Error("Failed to launch EC2 instance");

    const instanceId = instance.InstanceId;

    let publicDns = "";
    for (let i = 0; i < 15; i++) {
      const desc = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [instanceId] })
      );
      const inst = desc.Reservations?.[0]?.Instances?.[0];
      if (inst?.PublicDnsName) {
        publicDns = inst.PublicDnsName;
        break;
      }
      await new Promise((r) => setTimeout(r, 10000));
    }

    if (!publicDns) throw new Error("Instance did not get a public DNS");

    const ports = [
      { port: 3389, protocol: "tcp" },
      { port: 22, protocol: "tcp" },
      { port: 5900, protocol: "tcp" },
    ];

    for (const { port: p, protocol: proto } of ports) {
      try {
        await ec2Client.send(
          new AuthorizeSecurityGroupIngressCommand({
            GroupId: instance.SecurityGroups?.[0]?.GroupId,
            IpPermissions: [
              {
                IpProtocol: proto,
                FromPort: p,
                ToPort: p,
                IpRanges: [{ CidrIp: "0.0.0.0/0" }],
              },
            ],
          })
        );
      } catch (err: any) {
        if (
          [
            "InvalidPermission.Duplicate",
            "InvalidPermission.Malformed",
          ].includes(err.name)
        )
          continue;
        throw err;
      }
    }

    const connectionName = `${keyName}`;
    const username =
      protocol === "rdp"
        ? isWindows
          ? "Administrator"
          : isUbuntu
            ? "ubuntu"
            : "ec2-user"
        : isUbuntu
          ? "ubuntu"
          : "ec2-user";

    const password = defaultPassword;
    const port = protocol === "rdp" ? 3389 : protocol === "ssh" ? 22 : 5900;

    await guacDb.execute(
      `INSERT INTO guacamole_connection (connection_name, protocol)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE protocol = VALUES(protocol)`,
      [connectionName, protocol]
    );

    await guacDb.execute(
      `INSERT INTO guacamole_connection_parameter (connection_id, parameter_name, parameter_value)
       SELECT c.connection_id, p.name, p.value
       FROM guacamole_connection c
       JOIN (
         SELECT ? AS name, ? AS value
         UNION ALL SELECT 'username', ?
         UNION ALL SELECT 'password', ?
         UNION ALL SELECT 'ignore-cert', 'true'
         UNION ALL SELECT 'security', 'any'
         UNION ALL SELECT 'port', ?
       ) AS p
       WHERE c.connection_name = ?`,
      ["hostname", publicDns, username, password, String(port), connectionName]
    );

    return { instanceId, dns: publicDns, connectionName, protocol };
  } catch (e) {
    console.error(e);
    return {};
  }
}

export async function deleteInstance(keyName: string, instanceId: string) {
  const command = new TerminateInstancesCommand({ InstanceIds: [instanceId] });
  ec2Client.send(command);

  await guacDb.execute(
    `DELETE FROM guacamole_connection WHERE connection_name = ?`,
    [keyName]
  );

  return;
}

export async function startInstance(instanceId: string) {
  const command = new StartInstancesCommand({ InstanceIds: [instanceId] });
  return ec2Client.send(command);
}

export async function stopInstance(instanceId: string) {
  const command = new StopInstancesCommand({ InstanceIds: [instanceId] });
  return ec2Client.send(command);
}

async function fetchLatestAmi(
  owner: string,
  namePattern: string,
  label: string
) {
  const res = await ec2Client.send(
    new DescribeImagesCommand({
      Owners: [owner],
      Filters: [{ Name: "name", Values: [namePattern] }],
    })
  );

  const images = (res.Images || []).sort(
    (a, b) =>
      new Date(b.CreationDate!).getTime() - new Date(a.CreationDate!).getTime()
  );

  return images[0]
    ? {
        id: images[0].ImageId,
        name: label,
      }
    : null;
}
