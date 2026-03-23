// api.ts
import { BASE_URL, API_KEY } from "./config";

const headers = {
  "Content-Type": "application/json",
  "X-API-Key": API_KEY,
};

export interface CardData {
  status: string;
  card_id: string;
  points: number;
}

export interface Transaction {
  sale_id: number;
  card_id: string;
  date: string;
  delta: number;
  new_total: number;
}

async function request(method: string, path: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, { method, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Server error");
  return data;
}

export const api = {
  viewCard:        (id: string)         => request("GET",  `/view/${id}`),
  addPoints:       (id: string, n: number) => request("POST", `/add/${id}/${n}`),
  removePoints:    (id: string, n: number) => request("POST", `/remove/${id}/${n}`),
  setPoints:       (id: string, n: number) => request("POST", `/set/${id}/${n}`),
  createCard:      ()                   => request("PUT",  `/create_card`),
  getTransactions: (id: string)         => request("GET",  `/transactions/${id}`),
};
