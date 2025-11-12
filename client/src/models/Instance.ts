export interface Instance {
  id: string;
  state: string;
  protocol?: "ssh" | "rdp";
  username?: string;
  password?: string;
}
