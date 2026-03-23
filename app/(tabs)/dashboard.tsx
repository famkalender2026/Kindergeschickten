import { Geschichte, ladeAlleGeschichten } from "@/storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const { width, height } = Dimensions.get("window");
const RICHTIGER_PIN = "1234";

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

interface Stats {
  gesamt: number;
  likes: number;
  lieblingsGenre: string;
  lieblingsDauer: string;
  genreZaehler: Record<string, number>;
  dauerZaehler: Record<string, number>;
  letzteGeschichten: Geschichte[];
}

export default function DashboardScreen() {
  const router = useRouter();
  const [entsperrt, setEntsprerrt] = useState(false);
  const [pin, setPin] = useState("");
  const [fehler, setFehler] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      if (entsperrt) ladeDaten();
    }, [entsperrt]),
  );

  const ladeDaten = async () => {
    const alle = await ladeAlleGeschichten();
    const likes = alle.filter((g) => g.bewertung === "gut");
    const genreZaehler: Record<string, number> = {};
    const dauerZaehler: Record<string, number> = {};
    likes.forEach((g) => {
      genreZaehler[g.genre] = (genreZaehler[g.genre] || 0) + 1;
      dauerZaehler[g.dauer || "5"] = (dauerZaehler[g.dauer || "5"] || 0) + 1;
    });
    const lieblingsGenre =
      Object.entries(genreZaehler).sort((a, b) => b[1] - a[1])[0]?.[0] || "–";
    const lieblingsDauer =
      Object.entries(dauerZaehler).sort((a, b) => b[1] - a[1])[0]?.[0] || "–";
    setStats({
      gesamt: alle.length,
      likes: likes.length,
      lieblingsGenre,
      lieblingsDauer,
      genreZaehler,
      dauerZaehler,
      letzteGeschichten: likes.slice(0, 5),
    });
    fadeIn.setValue(0);
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const pruefePin = () => {
    if (pin === RICHTIGER_PIN) {
      setEntsprerrt(true);
      setFehler(false);
      ladeDaten();
    } else {
      setFehler(true);
      setPin("");
      Animated.sequence([
        Animated.timing(shake, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const maxGenreWert = stats
    ? Math.max(...Object.values(stats.genreZaehler), 1)
    : 1;

  if (!entsperrt) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0D0625",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        {/* Magi Button oben */}
        <TouchableOpacity style={styles.magiBtn} onPress={() => router.back()}>
          <Text style={styles.magiBtnText}>🪄 Magi</Text>
        </TouchableOpacity>

        <View style={styles.pinBox}>
          <Text style={{ fontSize: 60, marginBottom: 12 }}>👨‍👩‍👧</Text>
          <Text style={styles.pinTitel}>Eltern-Bereich</Text>
          <Text style={styles.pinUnter}>
            Bitte PIN eingeben um fortzufahren
          </Text>
          <Animated.View style={{ transform: [{ translateX: shake }] }}>
            <TextInput
              style={[styles.pinInput, fehler && styles.pinInputFehler]}
              value={pin}
              onChangeText={setPin}
              keyboardType="numeric"
              secureTextEntry
              maxLength={4}
              placeholder="• • • •"
              placeholderTextColor="#9B8FC0"
              onSubmitEditing={pruefePin}
            />
          </Animated.View>
          {fehler && (
            <Text style={styles.fehlerText}>
              ❌ Falscher PIN – versuche es nochmal
            </Text>
          )}
          <TouchableOpacity style={styles.pinButton} onPress={pruefePin}>
            <Text style={styles.pinButtonText}>Entsperren 🔓</Text>
          </TouchableOpacity>
          <Text style={styles.pinHinweis}>Standard-PIN: 1234</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0D0625" }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.magiBtn} onPress={() => router.back()}>
          <Text style={styles.magiBtnText}>🪄 Magi</Text>
        </TouchableOpacity>
        <View style={{ alignItems: "center", flex: 1 }}>
          <Text style={{ fontSize: 36 }}>📊</Text>
          <Text style={styles.headerTitel}>Eltern-Dashboard</Text>
          <Text style={styles.headerUnter}>Interessen deines Kindes</Text>
        </View>
        <TouchableOpacity
          style={styles.sperrButton}
          onPress={() => {
            setEntsprerrt(false);
            setPin("");
          }}
        >
          <Text style={styles.sperrText}>🔒</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={styles.hauptBereich}>
          {stats && (
            <Animated.View style={{ opacity: fadeIn }}>
              {/* Stat Karten */}
              <View style={styles.kartenReihe}>
                <View
                  style={[styles.statKarte, { backgroundColor: "#E8A020" }]}
                >
                  <Text style={styles.statZahl}>{stats.gesamt}</Text>
                  <Text style={styles.statLabel}>Geschichten{"\n"}gelesen</Text>
                </View>
                <View
                  style={[styles.statKarte, { backgroundColor: "#27AE60" }]}
                >
                  <Text style={styles.statZahl}>{stats.likes}</Text>
                  <Text style={styles.statLabel}>Geschichten{"\n"}gemocht</Text>
                </View>
              </View>
              <View style={styles.kartenReihe}>
                <View
                  style={[
                    styles.statKarte,
                    {
                      backgroundColor:
                        GENRE_FARBE[stats.lieblingsGenre] || "#9B59B6",
                    },
                  ]}
                >
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>
                    {GENRE_EMOJI[stats.lieblingsGenre] || "📖"}
                  </Text>
                  <Text style={styles.statZahl}>{stats.lieblingsGenre}</Text>
                  <Text style={styles.statLabel}>Lieblingsgenre</Text>
                </View>
                <View
                  style={[styles.statKarte, { backgroundColor: "#2980B9" }]}
                >
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>⏱️</Text>
                  <Text style={styles.statZahl}>
                    {stats.lieblingsDauer} Min
                  </Text>
                  <Text style={styles.statLabel}>Lieblingslänge</Text>
                </View>
              </View>

              {/* Genre Balken */}
              {Object.keys(stats.genreZaehler).length > 0 && (
                <View style={styles.abschnitt}>
                  <Text style={styles.abschnittTitel}>📚 Lieblingsgenres</Text>
                  {Object.entries(stats.genreZaehler)
                    .sort((a, b) => b[1] - a[1])
                    .map(([genre, anzahl]) => (
                      <View key={genre} style={styles.balkenZeile}>
                        <Text style={{ fontSize: 18, width: 24 }}>
                          {GENRE_EMOJI[genre]}
                        </Text>
                        <Text style={styles.balkenLabel}>{genre}</Text>
                        <View style={styles.balkenHintergrund}>
                          <View
                            style={[
                              styles.balken,
                              {
                                width:
                                  `${(anzahl / maxGenreWert) * 100}%` as any,
                                backgroundColor: GENRE_FARBE[genre],
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.balkenZahl}>{anzahl}x</Text>
                      </View>
                    ))}
                </View>
              )}

              {/* Dauer */}
              {Object.keys(stats.dauerZaehler).length > 0 && (
                <View style={styles.abschnitt}>
                  <Text style={styles.abschnittTitel}>
                    ⏱️ Bevorzugte Geschichtenlänge
                  </Text>
                  <View style={styles.dauerGrid}>
                    {Object.entries(stats.dauerZaehler)
                      .sort((a, b) => b[1] - a[1])
                      .map(([dauer, anzahl]) => (
                        <View key={dauer} style={styles.dauerKarte}>
                          <Text style={styles.dauerZahl}>{anzahl}x</Text>
                          <Text style={styles.dauerLabel}>{dauer} Min</Text>
                        </View>
                      ))}
                  </View>
                </View>
              )}

              {/* Letzte Geschichten */}
              {stats.letzteGeschichten.length > 0 && (
                <View style={styles.abschnitt}>
                  <Text style={styles.abschnittTitel}>
                    ⭐ Zuletzt gemochte Geschichten
                  </Text>
                  {stats.letzteGeschichten.map((g) => (
                    <View key={g.id} style={styles.geschichteZeile}>
                      <Text style={{ fontSize: 24 }}>
                        {GENRE_EMOJI[g.genre]}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.geschichteTitel} numberOfLines={1}>
                          {g.titel}
                        </Text>
                        <Text style={styles.geschichteMeta}>
                          {g.genre} • {g.datum} • Alter {g.alter}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 20 }}>👍</Text>
                    </View>
                  ))}
                </View>
              )}

              {stats.gesamt === 0 && (
                <View style={styles.leerBox}>
                  <Text style={{ fontSize: 50, textAlign: "center" }}>📊</Text>
                  <Text style={styles.leerTitel}>Noch keine Daten</Text>
                  <Text style={styles.leerText}>
                    Sobald dein Kind Geschichten liest und liked erscheinen hier
                    die Statistiken.
                  </Text>
                </View>
              )}
            </Animated.View>
          )}
          <View style={{ height: 30 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  magiBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  magiBtnText: { color: "white", fontSize: 13, fontWeight: "700" },
  header: {
    backgroundColor: "#2D0A5A",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitel: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFD700",
    textAlign: "center",
  },
  headerUnter: {
    fontSize: 12,
    color: "rgba(200,180,255,0.9)",
    marginTop: 2,
    textAlign: "center",
  },
  sperrButton: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 8,
  },
  sperrText: { fontSize: 20 },
  hauptBereich: {
    backgroundColor: "#F0E8FF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
    paddingTop: 20,
    paddingHorizontal: 14,
  },
  pinBox: {
    backgroundColor: "#2D0A5A",
    borderRadius: 32,
    padding: 32,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#5A3A8A",
  },
  pinTitel: { fontSize: 22, fontWeight: "900", color: "#FFD700" },
  pinUnter: {
    fontSize: 13,
    color: "#9B8FC0",
    marginTop: 6,
    marginBottom: 20,
    textAlign: "center",
  },
  pinInput: {
    borderWidth: 2,
    borderColor: "#7B3FA0",
    borderRadius: 16,
    padding: 14,
    fontSize: 28,
    letterSpacing: 16,
    textAlign: "center",
    width: 180,
    backgroundColor: "#1A0A3A",
    color: "#E8D5FF",
  },
  pinInputFehler: { borderColor: "#E74C3C", backgroundColor: "#2A0A0A" },
  fehlerText: {
    color: "#E74C3C",
    fontSize: 13,
    marginTop: 8,
    fontWeight: "600",
  },
  pinButton: {
    backgroundColor: "#7B3FA0",
    borderRadius: 20,
    paddingHorizontal: 40,
    paddingVertical: 14,
    marginTop: 20,
    elevation: 4,
  },
  pinButtonText: { color: "white", fontSize: 17, fontWeight: "900" },
  pinHinweis: { fontSize: 12, color: "#9B8FC0", marginTop: 14 },
  kartenReihe: { flexDirection: "row", gap: 12, marginBottom: 12 },
  statKarte: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  statZahl: { fontSize: 20, fontWeight: "900", color: "white" },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginTop: 4,
  },
  abschnitt: {
    backgroundColor: "#2D0A5A",
    borderRadius: 20,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#5A3A8A",
  },
  abschnittTitel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFD700",
    marginBottom: 12,
  },
  balkenZeile: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  balkenLabel: { fontSize: 12, fontWeight: "600", color: "#C0A0FF", width: 76 },
  balkenHintergrund: {
    flex: 1,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 6,
    overflow: "hidden",
  },
  balken: { height: "100%", borderRadius: 6 },
  balkenZahl: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9B8FC0",
    width: 28,
    textAlign: "right",
  },
  dauerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  dauerKarte: {
    backgroundColor: "#1A0A3A",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    minWidth: (width - 80) / 3,
    borderWidth: 1,
    borderColor: "#5A3A8A",
  },
  dauerZahl: { fontSize: 20, fontWeight: "900", color: "#FFD700" },
  dauerLabel: { fontSize: 11, color: "#9B8FC0", marginTop: 2 },
  geschichteZeile: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#1A0A3A",
    borderRadius: 14,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: "#5A3A8A",
  },
  geschichteTitel: { fontSize: 13, fontWeight: "700", color: "#E8D5FF" },
  geschichteMeta: { fontSize: 11, color: "#9B8FC0", marginTop: 2 },
  leerBox: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#2D0A5A",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#5A3A8A",
    marginBottom: 12,
  },
  leerTitel: {
    fontSize: 17,
    fontWeight: "800",
    color: "#E8D5FF",
    marginTop: 10,
  },
  leerText: {
    fontSize: 12,
    color: "#9B8FC0",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
});
