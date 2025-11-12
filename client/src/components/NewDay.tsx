import React, { useState, useEffect } from "react";
import TopMenu from "./TopMenu";

type Ami = {
  id: string;
  name: string;
  description?: string;
  owner?: string;
};

type InstanceType = string;

const tiers: InstanceType[] = ["Basic", "Standard", "Premium"];

export const NewDay = () => {
  const [instances, setInstances] = useState<any[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(
    null
  );

  const [amis, setAmis] = useState<Ami[]>([]);
  const [pricingTiers, setPricingTiers] = useState(tiers);

  const [selectedAmi, setSelectedAmi] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [keyName, setKeyName] = useState<string>("");
  const [subnetId, setSubnetId] = useState<string>("");
  const [sgId, setSgId] = useState<string>("");

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (message: string, type: "success" | "error") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  useEffect(() => {
    const fetchData = async () => {
      const [listRes, amisRes] = await Promise.all([
        fetch("/api/ec2/list"),
        fetch("/api/ec2/amis"),
      ]);

      const instancesList = await listRes.json();
      const amisList = await amisRes.json();

      setAmis(amisList);

      const mappedInstances = instancesList.map((inst: any) => {
        const match = amisList.find((a: Ami) => a?.id === inst.amiId);
        return {
          ...inst,
          amiName: match ? match.name : "Ubuntu 22.04 LTS",
        };
      });

      setInstances(mappedInstances);

      if (!amisList.find((a) => a.id === selectedAmi)) {
        const ubuntu = amisList.find((a) =>
          a.name.toLowerCase().includes("ubuntu")
        );
        if (ubuntu) {
          setSelectedAmi(ubuntu.id);
        }
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedInstanceId) {
      setKeyName("");
      setSelectedAmi("");
      setSelectedType("");
      setSubnetId("");
      setSgId("");
      return;
    }

    const inst = instances.find((i) => i.id === selectedInstanceId);
    if (inst) {
      setKeyName(inst.name || "");
      setSelectedAmi(inst.amiId || "");
      setSelectedType(inst.type || "");
      setSubnetId(inst.subnetId || "");
      setSgId(inst.sgId || "");
    }
  }, [selectedInstanceId, instances]);

  const handleProvision = async () => {
    const body = {
      amiId: selectedAmi,
      keyName,
      pricingTier: selectedType,
    };

    const res = await fetch("/api/ec2/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      addNotification("Error provisioning instance!", "error");
      return;
    }

    addNotification("Provisioned instance: " + keyName, "success");

    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const handleUpdate = async () => {
    const body = {
      instanceId: selectedInstanceId,
      newType: selectedType,
    };

    const res = await fetch("/api/ec2/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    alert("Updated instance: " + JSON.stringify(data));
  };

  const handleDelete = async () => {
    const res = await fetch("/api/ec2/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyName: keyName,
        instanceId: selectedInstanceId,
      }),
    });

    if (res.ok) {
      addNotification("Deleted instance successfully!", "success");
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      const err = await res.json();
      addNotification("Failed to delete instance: " + err.error, "error");
    }
  };

  const isEditMode = !!selectedInstanceId;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ position: "fixed", top: 10, right: 10, zIndex: 1000 }}>
        {notifications.map((n) => (
          <div
            key={n.id}
            style={{
              marginBottom: "10px",
              padding: "12px 20px",
              borderRadius: "8px",
              backgroundColor: n.type === "success" ? "#28a745" : "#dc3545",
              color: "white",
              fontWeight: 600,
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            {n.message}
          </div>
        ))}
      </div>

      <div style={{ height: "60px", flexShrink: 0 }}>
        <TopMenu />
      </div>

      <div style={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
        <div
          style={{
            width: "250px",
            backgroundColor: "#f4f4f4",
            padding: "20px",
            overflowY: "auto",
            flexShrink: 0,
            boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ marginTop: 0 }}>My Instances</h3>
          <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
            <li
              key={"newinstance"}
              onClick={() => setSelectedInstanceId(null)}
              style={{
                padding: "15px",
                margin: "10px 0",
                cursor: "pointer",
                borderRadius: "8px",
                backgroundColor: "#00bfffff",
                border: "1px solid #ddd",
                transition: "all 0.2s ease-in-out",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              🌻 Launch New Instance
            </li>
            {instances.map((inst) => (
              <li
                key={inst.id}
                onClick={() => setSelectedInstanceId(inst.id)}
                style={{
                  padding: "15px",
                  margin: "10px 0",
                  cursor: "pointer",
                  borderRadius: "8px",
                  backgroundColor:
                    selectedInstanceId === inst.id ? "#007bff" : "white",
                  color: selectedInstanceId === inst.id ? "white" : "black",
                  border: "1px solid #ddd",
                  transition: "all 0.2s ease-in-out",
                  boxShadow:
                    selectedInstanceId === inst.id
                      ? "0 2px 6px rgba(0,0,0,0.2)"
                      : "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "1.1em" }}>
                  🖥️ {inst.name || "(no name)"}
                </div>
                <div style={{ fontSize: "0.9em", marginTop: "4px" }}>
                  <strong>Pricing Tier:</strong> {inst.tier}
                </div>
                {inst.amiName && (
                  <div style={{ fontSize: "0.9em", marginTop: "2px" }}>
                    <strong>Type:</strong> {inst.amiName}
                  </div>
                )}
                <div
                  style={{
                    fontSize: "0.85em",
                    marginTop: "6px",
                    fontWeight: "bold",
                    color:
                      inst.state === "running"
                        ? "green"
                        : inst.state === "stopped"
                          ? "red"
                          : "orange",
                  }}
                >
                  ● {inst.state.toUpperCase()}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div
          style={{
            display: "flex",
            flexGrow: 1,
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={styles.container}>
            <h2>
              {isEditMode ? "✏️ Update Instance" : "🌻 Launch New Instance"}
            </h2>

            <label style={styles.label}>Name:</label>
            <input
              type="text"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              style={styles.input}
              placeholder="Machine Name"
              disabled={isEditMode}
            />

            <label style={styles.label}>AMI:</label>
            <select
              value={selectedAmi}
              onChange={(e) => setSelectedAmi(e.target.value)}
              style={styles.select}
              disabled={isEditMode}
            >
              <option value="">-- Select AMI --</option>
              {amis.map((ami) => (
                <option key={ami?.id} value={ami?.id}>
                  {ami?.name} ({ami?.id})
                </option>
              ))}
            </select>

            <label style={styles.label}>Pricing Tier:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={styles.select}
            >
              <option value="">-- Select Pricing Tier --</option>
              {pricingTiers.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {!isEditMode && (
              <button
                onClick={isEditMode ? handleUpdate : handleProvision}
                disabled={!selectedAmi || !selectedType}
                style={{
                  ...styles.button,
                  backgroundColor:
                    !selectedAmi || !selectedType ? "#ccc" : "#007bff",
                  cursor:
                    !selectedAmi || !selectedType ? "not-allowed" : "pointer",
                }}
              >
                🚀 Launch New Instance
              </button>
            )}

            {isEditMode && (
              <button
                onClick={handleDelete}
                style={{
                  ...styles.button,
                  backgroundColor: "#dc3545",
                  marginTop: "12px",
                  cursor: "pointer",
                }}
              >
                🗑️ Delete Instance
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: "600px",
    margin: "40px auto",
    padding: "20px",
    backgroundColor: "#fff",
    borderRadius: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    fontFamily: "Arial, sans-serif",
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontWeight: 600,
  },
  select: {
    width: "100%",
    padding: "8px",
    marginBottom: "16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    padding: "8px",
    marginBottom: "16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "14px",
  },
  button: {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    color: "#fff",
    fontSize: "16px",
  },
};

