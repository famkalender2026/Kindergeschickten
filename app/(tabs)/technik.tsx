import {
    Einstellungen,
    ladeEinstellungen,
    speichereEinstellungen,
} from "@/storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

const GENRE_FARBE: Record<string, string> = {
  Abenteuer: "#FF6B35",
  Märchen: "#9B59B6",
  Tiere: "#27AE60",
  Weltraum: "#2980B9",
  Detektiv: "#E74C3C",
};
const GENRE_EMOJI: Record<string, string> = {
  Abenteuer: "🗺️",
  Märchen: "🏰",
  Tiere: "🐾",
  Weltraum: "🚀",
  Detektiv: "🔍",
};
const DAUER_OPTIONEN = [
  { label: "2 Min ⚡", wert: "2" },
  { label: "5 Min 📖", wert: "5" },
  { label: "10 Min 🌟", wert: "10" },
  { label: "15 Min 🏆", wert: "15" },
];

export default function TechnikScreen() {
  const [einstellungen, setEinstellungen] = useState<Einstellungen>({
    alter: "5",
    dauer: "5",
    genre: "Abenteuer",
    name: "",
  });
  const [gespeichert, setGespeichert] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      ladeEinstellungen().then(setEinstellungen);
    }, []),
  );

  const speichern = async () => {
    await speichereEinstellungen(einstellungen);
    setGespeichert(true);
    setTimeout(() => setGespeichert(false), 2000);
  };

  const genres = Object.keys(GENRE_FARBE);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>⚙️</Text>
        <Text style={styles.headerTitel}>Zauber-Technik</Text>
        <Text style={styles.headerUnter}>Passe die App für dich an!</Text>
      </View>

      <View style={styles.karte}>
        <Text style={styles.karteLabel}>👤 Wie heißt du?</Text>
        <TextInput
          style={styles.input}
          value={einstellungen.name}
          onChangeText={(v) => setEinstellungen((e) => ({ ...e, name: v }))}
          placeholder="Dein Name (optional)"
          placeholderTextColor="#BBB"
        />
      </View>

      <View style={styles.karte}>
        <Text style={styles.karteLabel}>🎂 Wie alt bist du?</Text>
        <View style={styles.alterGrid}>
          {["4", "5", "6", "7", "8", "9", "10", "11", "12"].map((a) => (
            <TouchableOpacity
              key={a}
              style={[
                styles.alterChip,
                einstellungen.alter === a && styles.alterChipAktiv,
              ]}
              onPress={() => setEinstellungen((e) => ({ ...e, alter: a }))}
            >
              <Text
                style={[
                  styles.alterText,
                  einstellungen.alter === a && { color: "white" },
                ]}
              >
                {a}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.karte}>
        <Text style={styles.karteLabel}>
          ⏱️ Wie lang sollen Geschichten sein?
        </Text>
        <View style={styles.dauerGrid}>
          {DAUER_OPTIONEN.map((d) => (
            <TouchableOpacity
              key={d.wert}
              style={[
                styles.dauerChip,
                einstellungen.dauer === d.wert && styles.dauerChipAktiv,
              ]}
              onPress={() => setEinstellungen((e) => ({ ...e, dauer: d.wert }))}
            >
              <Text
                style={[
                  styles.dauerText,
                  einstellungen.dauer === d.wert && { color: "white" },
                ]}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.karte}>
        <Text style={styles.karteLabel}>📚 Lieblingsgenre</Text>
        <View style={styles.genreGrid}>
          {genres.map((g) => (
            <TouchableOpacity
              key={g}
              style={[
                styles.genreChip,
                einstellungen.genre === g && {
                  backgroundColor: GENRE_FARBE[g],
                  borderColor: GENRE_FARBE[g],
                },
              ]}
              onPress={() => setEinstellungen((e) => ({ ...e, genre: g }))}
            >
              <Text style={{ fontSize: 26, marginBottom: 4 }}>
                {GENRE_EMOJI[g]}
              </Text>
              <Text
                style={[
                  styles.genreText,
                  einstellungen.genre === g && { color: "white" },
                ]}
              >
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.speichernButton,
          gespeichert && styles.speichernButtonOk,
        ]}
        onPress={speichern}
      >
        <Text style={styles.speichernText}>
          {gespeichert ? "✅ Gespeichert!" : "💾 Einstellungen speichern"}
        </Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitel}>ℹ️ Was passiert mit diesen Daten?</Text>
        <Text style={styles.infoText}>
          Deine Einstellungen werden nur auf diesem Gerät gespeichert. Sie
          werden verwendet um die Geschichten besser auf dich anzupassen. Es
          werden keine Daten nach außen übertragen.
        </Text>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0FFF4" },
  header: {
    backgroundColor: "#1565C0",
    padding: 28,
    alignItems: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerEmoji: { fontSize: 55, marginBottom: 8 },
  headerTitel: { fontSize: 26, fontWeight: "900", color: "white" },
  headerUnter: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  karte: {
    backgroundColor: "white",
    borderRadius: 24,
    margin: 14,
    marginBottom: 0,
    padding: 18,
    elevation: 4,
  },
  karteLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: "#2D5016",
    marginBottom: 12,
  },
  input: {
    borderWidth: 2.5,
    borderColor: "#A8E063",
    borderRadius: 16,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#FAFFF5",
    color: "#333",
  },
  alterGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  alterChip: {
    borderWidth: 2,
    borderColor: "#DDD",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FAFAFA",
  },
  alterChipAktiv: { backgroundColor: "#1565C0", borderColor: "#1565C0" },
  alterText: { fontSize: 16, fontWeight: "800", color: "#555" },
  dauerGrid: { flexDirection: "row", gap: 8 },
  dauerChip: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#DDD",
    borderRadius: 16,
    padding: 10,
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  dauerChipAktiv: { backgroundColor: "#1565C0", borderColor: "#1565C0" },
  dauerText: { fontSize: 12, fontWeight: "700", color: "#555" },
  genreGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  genreChip: {
    borderWidth: 2.5,
    borderColor: "#A8E063",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "white",
    alignItems: "center",
    minWidth: 88,
  },
  genreText: { fontSize: 12, fontWeight: "600", color: "#555" },
  speichernButton: {
    backgroundColor: "#1565C0",
    borderRadius: 24,
    margin: 14,
    padding: 18,
    alignItems: "center",
    elevation: 6,
  },
  speichernButtonOk: { backgroundColor: "#27AE60" },
  speichernText: { color: "white", fontSize: 18, fontWeight: "900" },
  infoBox: {
    backgroundColor: "#E3F2FD",
    borderRadius: 20,
    margin: 14,
    padding: 16,
  },
  infoTitel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1565C0",
    marginBottom: 8,
  },
  infoText: { fontSize: 13, color: "#555", lineHeight: 20 },
});
