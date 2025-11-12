import { useCallback, useEffect, useRef, useState } from "react";
import Guacamole from "guacamole-common-js";
import TopMenu from "./TopMenu";

type Connection = {
  name: string;
  identifier: string;
  protocol: string;
};

type GuacamoleTreeResponse = {
  childConnections: Connection[];
};

const DATA_SOURCE = "mysql";
const TOP_MENU_HEIGHT = "60px";

export const Viewer = () => {
  const displayRef = useRef<HTMLDivElement>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeClient, setActiveClient] = useState(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | number | null
  >(null);

  const connectGuacamole = useCallback(
    (connectionId: string) => {
      const token = sessionStorage.getItem("authToken");

      if (activeClient) {
        activeClient.disconnect();
        setActiveClient(null);
      }

      setSelectedConnectionId(connectionId);

      const tunnel = new Guacamole.WebSocketTunnel(
        `wss://${window.location.hostname}/guacamole/websocket-tunnel`
      );
      const client = new Guacamole.Client(tunnel);
      setActiveClient(client);

      client.connect(
        `token=${token}&GUAC_ID=${connectionId}&GUAC_TYPE=c&GUAC_DATA_SOURCE=${DATA_SOURCE}`
      );

      const mouse = new Guacamole.Mouse(client.getDisplay().getElement());
      mouse.onmousedown =
        mouse.onmouseup =
        mouse.onmousemove =
          (state: any) => {
            client.sendMouseState(state);
          };

      const keyboard = new Guacamole.Keyboard(document);
      keyboard.onkeydown = (keysym: any) => {
        client.sendKeyEvent(1, keysym);
        return false;
      };
      keyboard.onkeyup = (keysym: any) => {
        client.sendKeyEvent(0, keysym);
        return false;
      };

      if (displayRef.current) {
        displayRef.current.innerHTML = "";
        const guacDisplayElement = client
          .getDisplay()
          .getElement() as HTMLElement;
        guacDisplayElement.style.width = "100%";
        guacDisplayElement.style.height = "100%";

        displayRef.current.appendChild(guacDisplayElement);
      }

      const resizeDisplay = () => {
        if (!displayRef.current) return;
        const display = client.getDisplay();
        const scale = Math.min(
          displayRef.current.offsetWidth / display.getWidth(),
          displayRef.current.offsetHeight / display.getHeight()
        );
        if (scale && isFinite(scale)) {
          display.scale(scale);
        }
      };

      window.addEventListener("resize", resizeDisplay);
      resizeDisplay();

      return () => {
        keyboard.onkeydown = null;
        keyboard.onkeyup = null;
        mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = null;
        client.disconnect();
      };
    },
    [activeClient]
  );

  const openFullscreen = useCallback((connectionId: string) => {
    const firstBytes = Buffer.from(connectionId, "ascii");
    const secondBytes = Buffer.from("c", "ascii");
    const thirdBytes = Buffer.from("mysql", "ascii");
    const empty = Buffer.from([0x00]);

    const encoded = Buffer.concat([
      firstBytes,
      empty,
      secondBytes,
      empty,
      thirdBytes,
    ])
      .toString("base64")
      .replace(/=+$/, "");

    const url = `https://${window.location.hostname}/guacamole/#/client/${encoded}`;
    window.open(url, "_blank");
  }, []);

  useEffect(() => {
    async function fetchConnections() {
      try {
        const token = sessionStorage.getItem("authToken");
        if (!token) return;

        const response = await fetch(
          `/guacamole/api/session/data/${DATA_SOURCE}/connectionGroups/ROOT/tree?token=${token}`,
          { method: "GET" }
        );

        const data: GuacamoleTreeResponse = await response.json();

        const validConnections = data.childConnections.filter(
          (conn) => conn.identifier && conn.name
        );
        setConnections(validConnections);
      } catch (err) {
        console.error("Failed to fetch Guacamole connections:", err);
      }
    }

    fetchConnections();
  }, []);

  useEffect(() => {
    return () => {
      if (activeClient) {
        activeClient.disconnect();
      }
    };
  }, [activeClient]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ height: TOP_MENU_HEIGHT, flexShrink: 0 }}>
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
          <h3 style={{ marginTop: 0 }}>
            Connections{" "}
            {!!selectedConnectionId ? (
              <button
                onClick={() => openFullscreen(selectedConnectionId)}
                style={{
                  marginLeft: "8px",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.85em",
                }}
                title="Open in fullscreen"
              >
                ⛶ Full Screen
              </button>
            ) : (
              <></>
            )}
          </h3>
          <ul style={{ listStyleType: "none", padding: 0 }}>
            {connections.map((conn) => (
              <li
                key={conn.identifier}
                onClick={() => connectGuacamole(conn.identifier)}
                style={{
                  padding: "10px",
                  margin: "5px 0",
                  cursor: "pointer",
                  borderRadius: "4px",
                  backgroundColor:
                    selectedConnectionId === conn.identifier
                      ? "#007bff"
                      : "white",
                  color:
                    selectedConnectionId === conn.identifier
                      ? "white"
                      : "black",
                  border: "1px solid #ddd",
                  transition: "background-color 0.2s, color 0.2s",
                }}
              >
                🖥️ {conn.name}
                <div style={{ fontSize: "0.8em", opacity: 0.7 }}>
                  ({conn.protocol.toUpperCase()})
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ flexGrow: 1, overflow: "hidden", position: "relative" }}>
          {connections.length === 0 && (
            <div
              style={{ padding: "20px", textAlign: "center", color: "#666" }}
            >
              Loading ....
            </div>
          )}
          {!selectedConnectionId && connections.length > 0 && (
            <div
              style={{ padding: "20px", textAlign: "center", color: "#666" }}
            >
              Select a connection from the menu to start a remote session.
            </div>
          )}
          <div
            ref={displayRef}
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              top: 0,
              left: 0,
            }}
          />
        </div>
      </div>
    </div>
  );
};

