import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Geschichte {
  id: string;
  titel: string;
  text: string;
  genre: string;
  akteure: string;
  alter: string;
  dauer?: string;
  datum: string;
  bewertung: "gut" | "schlecht" | null;
}

export interface Kristalle {
  anzahl: number;
  gesamtVerdient: number;
  filmFreigeschaltet: boolean;
}

export interface Einstellungen {
  alter: string;
  dauer: string;
  genre: string;
  name: string;
}

export interface Lesefortschritt {
  geschichteId: string;
  titel: string;
  genre: string;
  aktuelleSeite: number;
  gesamtSeiten: number;
  datum: string;
}

const SCHLUESSEL = "gespeicherte_geschichten";
const KRISTALL_SCHLUESSEL = "kristalle";
const EINSTELLUNG_SCHLUESSEL = "einstellungen";
const FORTSCHRITT_SCHLUESSEL = "lesefortschritt";

export const speichereGeschichte = async (g: Geschichte): Promise<void> => {
  const alle = await ladeAlleGeschichten();
  const aktualisiert = alle.filter((x) => x.id !== g.id);
  aktualisiert.unshift(g);
  await AsyncStorage.setItem(
    SCHLUESSEL,
    JSON.stringify(aktualisiert.slice(0, 50)),
  );
};

export const ladeAlleGeschichten = async (): Promise<Geschichte[]> => {
  const daten = await AsyncStorage.getItem(SCHLUESSEL);
  return daten ? JSON.parse(daten) : [];
};

export const ladeLieblingsgeschichten = async (): Promise<Geschichte[]> => {
  const alle = await ladeAlleGeschichten();
  return alle.filter((g) => g.bewertung === "gut");
};

export const ladeKristalle = async (): Promise<Kristalle> => {
  const daten = await AsyncStorage.getItem(KRISTALL_SCHLUESSEL);
  return daten
    ? JSON.parse(daten)
    : { anzahl: 0, gesamtVerdient: 0, filmFreigeschaltet: false };
};

export const addKristall = async (): Promise<Kristalle> => {
  const k = await ladeKristalle();
  const neu: Kristalle = {
    anzahl: k.anzahl + 1,
    gesamtVerdient: k.gesamtVerdient + 1,
    filmFreigeschaltet: k.anzahl + 1 >= 10,
  };
  await AsyncStorage.setItem(KRISTALL_SCHLUESSEL, JSON.stringify(neu));
  return neu;
};

export const ladeEinstellungen = async (): Promise<Einstellungen> => {
  const daten = await AsyncStorage.getItem(EINSTELLUNG_SCHLUESSEL);
  return daten
    ? JSON.parse(daten)
    : { alter: "5", dauer: "5", genre: "Abenteuer", name: "" };
};

export const speichereEinstellungen = async (
  e: Einstellungen,
): Promise<void> => {
  await AsyncStorage.setItem(EINSTELLUNG_SCHLUESSEL, JSON.stringify(e));
};

export const speichereLesefortschritt = async (
  f: Lesefortschritt,
): Promise<void> => {
  await AsyncStorage.setItem(FORTSCHRITT_SCHLUESSEL, JSON.stringify(f));
};

export const ladeLesefortschritt =
  async (): Promise<Lesefortschritt | null> => {
    const daten = await AsyncStorage.getItem(FORTSCHRITT_SCHLUESSEL);
    return daten ? JSON.parse(daten) : null;
  };

export const loescheLesefortschritt = async (): Promise<void> => {
  await AsyncStorage.removeItem(FORTSCHRITT_SCHLUESSEL);
};

export const erstellePersonalisiertesPrompt = async (
  alter: string,
  akteure: string,
  genre: string,
  dauer: string,
): Promise<string> => {
  const lieblinge = await ladeLieblingsgeschichten();
  let lernTeil = "";
  if (lieblinge.length > 0) {
    const beispiele = lieblinge
      .slice(0, 3)
      .map((g) => `- "${g.titel}" (${g.genre}, Akteure: ${g.akteure})`)
      .join("\n");
    lernTeil = `\n\nDas Kind hat diese Geschichten mit Daumen hoch bewertet:\n${beispiele}\nSchreibe eine ähnliche Geschichte.`;
  }
  return `Schreibe eine Kindergeschichte auf Deutsch. Alter: ${alter} Jahre. Akteure: ${akteure || "ein kleines Kaninchen"}. Genre: ${genre}. Spannend, lehrreich und kindgerecht. Gib einen Titel mit ** darum. Ca. ${dauer} Minuten Lesezeit.${lernTeil} Beginne direkt mit dem Titel.`;
};
