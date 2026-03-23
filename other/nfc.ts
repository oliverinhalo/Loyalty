// nfc.ts
import NfcManager, { NfcTech, Ndef } from "react-native-nfc-manager";

export async function initNfc(): Promise<boolean> {
  return await NfcManager.isSupported();
}

/** Read the first NDEF text record from a tag. Returns the string or null. */
export async function readNfcTag(): Promise<string | null> {
  await NfcManager.requestTechnology(NfcTech.Ndef);
  try {
    const tag = await NfcManager.getTag();
    const records = tag?.ndefMessage ?? [];
    for (const record of records) {
      const text = Ndef.text.decodePayload(record.payload as unknown as Uint8Array);
      if (text) return text;
    }
    return null;
  } finally {
    NfcManager.cancelTechnologyRequest();
  }
}

/** Write a plain text NDEF record to a tag. */
export async function writeNfcTag(text: string): Promise<void> {
  await NfcManager.requestTechnology(NfcTech.Ndef);
  try {
    const bytes = Ndef.encodeMessage([Ndef.textRecord(text)]);
    if (bytes) await NfcManager.ndefHandler.writeNdefMessage(bytes);
  } finally {
    NfcManager.cancelTechnologyRequest();
  }
}

export function cleanupNfc() {
  NfcManager.cancelTechnologyRequest().catch(() => {});
}
