import {
    addKristall,
    Geschichte,
    Kristalle,
    ladeAlleGeschichten,
    ladeKristalle,
} from "@/storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width, height } = Dimensions.get("window");

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

function SchwebenderStern({
  x,
  y,
  groesse,
  verzoegerung,
}: {
  x: number;
  y: number;
  groesse: number;
  verzoegerung: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const glitzer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: -12,
          duration: 2000 + verzoegerung,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 2000 + verzoegerung,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glitzer, {
          toValue: 1,
          duration: 1000 + verzoegerung,
          useNativeDriver: true,
        }),
        Animated.timing(glitzer, {
          toValue: 0.3,
          duration: 1000 + verzoegerung,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  return (
    <Animated.Text
      style={[
        { position: "absolute", left: x, top: y, fontSize: groesse },
        { transform: [{ translateY: anim }], opacity: glitzer },
      ]}
    >
      ⭐
    </Animated.Text>
  );
}

export default function SchatzScreen() {
  const router = useRouter();
  const [kristalle, setKristalle] = useState<Kristalle>({
    anzahl: 0,
    gesamtVerdient: 0,
    filmFreigeschaltet: false,
  });
  const [modus, setModus] = useState<"auswahl" | "quiz" | "belohnung" | "film">(
    "auswahl",
  );
  const [aktuelleGeschichte, setAktuelleGeschichte] =
    useState<Geschichte | null>(null);
  const [fragen, setFragen] = useState<any[]>([]);
  const [aktueleFrage, setAktueleFrage] = useState(0);
  const [richtigeAntworten, setRichtigeAntworten] = useState(0);
  const [ausgewaehlt, setAusgewaehlt] = useState<number | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [geschichten, setGeschichten] = useState<Geschichte[]>([]);

  const kristallAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      ladeAlles();
    }, []),
  );

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -8,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoAnim, {
          toValue: -8,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(logoAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ]),
    ).start();
  }, []);

  const ladeAlles = async () => {
    const k = await ladeKristalle();
    setKristalle(k);
    const alle = await ladeAlleGeschichten();
    setGeschichten(alle.filter((g) => g.bewertung === "gut"));
  };

  const erstelleFragen = async (g: Geschichte) => {
    setLaedt(true);
    try {
      const prompt = `Basierend auf dieser Kindergeschichte erstelle genau 3 Multiple-Choice-Fragen auf Deutsch.\nGeschichte: "${g.text.slice(0, 800)}"\n\nAntworte NUR mit diesem JSON-Format:\n[\n  {"frage": "...", "antworten": ["...", "...", "..."], "richtig": 0},\n  {"frage": "...", "antworten": ["...", "...", "..."], "richtig": 1},\n  {"frage": "...", "antworten": ["...", "...", "..."], "richtig": 2}\n]`;
      const antwort = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer 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",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 800,
          }),
        },
      );
      const daten = await antwort.json();
      const text = daten.choices[0].message.content;
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setFragen(parsed);
        setAktueleFrage(0);
        setRichtigeAntworten(0);
        setAusgewaehlt(null);
        setModus("quiz");
      }
    } catch {
      alert("Fehler beim Laden der Fragen!");
    }
    setLaedt(false);
  };

  const antwortWaehlen = async (index: number) => {
    if (ausgewaehlt !== null) return;
    setAusgewaehlt(index);
    const istRichtig = index === fragen[aktueleFrage].richtig;
    if (istRichtig) {
      setRichtigeAntworten((prev) => prev + 1);
      Animated.sequence([
        Animated.timing(kristallAnim, {
          toValue: 1.4,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(kristallAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
    setTimeout(async () => {
      if (aktueleFrage < fragen.length - 1) {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(async () => {
          setAktueleFrage((prev) => prev + 1);
          setAusgewaehlt(null);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        });
      } else {
        const endRichtig = istRichtig
          ? richtigeAntworten + 1
          : richtigeAntworten;
        if (endRichtig === 3) {
          const neueKristalle = await addKristall();
          setKristalle(neueKristalle);
        }
        setModus("belohnung");
      }
    }, 1200);
  };

  // FILM SCREEN
  if (modus === "film") {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0D0625",
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
        }}
      >
        <TouchableOpacity style={styles.magiBtn} onPress={() => router.back()}>
          <Text style={styles.magiBtnText}>🪄 Magi</Text>
        </TouchableOpacity>
        <View style={styles.filmBox}>
          <Text style={{ fontSize: 55, textAlign: "center", marginBottom: 8 }}>
            🎬✨🎉
          </Text>
          <Text style={styles.filmTitel}>Dein Zauberfilm!</Text>
          <Text style={styles.filmText}>
            Du hast 10 Zauberkristalle gesammelt!
          </Text>
          <View style={styles.filmKarte}>
            <Text style={{ fontSize: 50, textAlign: "center" }}>🦕🌟🚀</Text>
            <Text style={styles.filmKarteText}>
              Eine magische Reise durch die Welt der Geschichten wartet auf
              dich!
            </Text>
            <Text style={styles.filmKarteUnter}>
              🎵 Musik an und genießen! 🎵
            </Text>
          </View>
          <View style={styles.filmSzenen}>
            {[
              "🦁 Der mutige Löwe",
              "🧚 Die Zauberblume",
              "🚀 Reise zu den Sternen",
              "🐉 Der freundliche Drache",
            ].map((s, i) => (
              <View key={i} style={styles.filmSzene}>
                <Text style={styles.filmSzeneText}>{s}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.magiZurueckBtn}
            onPress={() => {
              setModus("auswahl");
              ladeAlles();
            }}
          >
            <Text style={styles.magiZurueckText}>🪄 Zurück zu Magi</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // BELOHNUNG SCREEN
  if (modus === "belohnung") {
    const gewonnen = richtigeAntworten === 3;
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
        <TouchableOpacity style={styles.magiBtn} onPress={() => router.back()}>
          <Text style={styles.magiBtnText}>🪄 Magi</Text>
        </TouchableOpacity>
        <View style={styles.belohnungBox}>
          <Text style={{ fontSize: 70, textAlign: "center" }}>
            {gewonnen ? "💎" : "😊"}
          </Text>
          <Text style={styles.belohnungTitel}>
            {gewonnen ? "Perfekt! Du bist ein Held!" : "Gut versucht!"}
          </Text>
          <Text style={styles.belohnungUnter}>
            {richtigeAntworten} von 3 Fragen richtig
          </Text>
          {gewonnen && (
            <View style={{ alignItems: "center", marginTop: 16 }}>
              <Animated.Text
                style={[
                  { fontSize: 50 },
                  { transform: [{ scale: kristallAnim }] },
                ]}
              >
                💎
              </Animated.Text>
              <Text style={styles.belohnungKristallText}>
                +1 Zauberkristall!
              </Text>
            </View>
          )}
          <View style={styles.kristallStand}>
            <Text style={styles.kristallStandText}>
              Deine Kristalle: {kristalle.anzahl} / 10
            </Text>
            <View style={styles.kristallBalken}>
              {Array.from({ length: 10 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.kristallPunkt,
                    i < kristalle.anzahl && styles.kristallPunktAktiv,
                  ]}
                />
              ))}
            </View>
          </View>
          {kristalle.anzahl >= 10 && (
            <TouchableOpacity
              style={styles.filmButton}
              onPress={() => setModus("film")}
            >
              <Text style={styles.filmButtonText}>🎬 Film anschauen!</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.magiZurueckBtn}
            onPress={() => {
              setModus("auswahl");
              ladeAlles();
            }}
          >
            <Text style={styles.magiZurueckText}>🪄 Zurück zu Magi</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // QUIZ SCREEN
  if (modus === "quiz" && fragen.length > 0) {
    const frage = fragen[aktueleFrage];
    const farbe = aktuelleGeschichte
      ? GENRE_FARBE[aktuelleGeschichte.genre] || "#FF6B35"
      : "#FF6B35";
    return (
      <View style={{ flex: 1, backgroundColor: "#0D0625" }}>
        <View style={[styles.quizHeader, { backgroundColor: farbe }]}>
          <TouchableOpacity
            style={styles.magiBtn}
            onPress={() => setModus("auswahl")}
          >
            <Text style={styles.magiBtnText}>🪄 Magi</Text>
          </TouchableOpacity>
          <Text style={styles.quizHeaderText}>
            Frage {aktueleFrage + 1} von {fragen.length}
          </Text>
          <View style={styles.quizFortschritt}>
            {fragen.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.quizPunkt,
                  i <= aktueleFrage && { backgroundColor: "white" },
                ]}
              />
            ))}
          </View>
        </View>
        <ScrollView style={{ flex: 1 }}>
          <Animated.View style={[styles.quizBox, { opacity: fadeAnim }]}>
            <Text
              style={{ fontSize: 40, textAlign: "center", marginBottom: 12 }}
            >
              🤔
            </Text>
            <Text style={styles.quizFrage}>{frage.frage}</Text>
            <View style={styles.quizAntworten}>
              {frage.antworten.map((a: string, i: number) => {
                let bg = "#1A0A3A";
                let rahmen = "#5A3A8A";
                if (ausgewaehlt !== null) {
                  if (i === frage.richtig) {
                    bg = "rgba(10,42,10,0.9)";
                    rahmen = "#27AE60";
                  } else if (i === ausgewaehlt) {
                    bg = "rgba(42,10,10,0.9)";
                    rahmen = "#E74C3C";
                  }
                }
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.antwortButton,
                      { backgroundColor: bg, borderColor: rahmen },
                    ]}
                    onPress={() => antwortWaehlen(i)}
                    disabled={ausgewaehlt !== null}
                  >
                    <Text style={styles.antwortBuchstabe}>
                      {["A", "B", "C"][i]}
                    </Text>
                    <Text style={styles.antwortText}>{a}</Text>
                    {ausgewaehlt !== null && i === frage.richtig && (
                      <Text style={{ fontSize: 20 }}>✅</Text>
                    )}
                    {ausgewaehlt === i && i !== frage.richtig && (
                      <Text style={{ fontSize: 20 }}>❌</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // AUSWAHL SCREEN
  return (
    <View style={{ flex: 1, backgroundColor: "#0D0625" }}>
      <View style={styles.himmel}>
        <SchwebenderStern x={20} y={20} groesse={14} verzoegerung={0} />
        <SchwebenderStern
          x={width * 0.6}
          y={25}
          groesse={18}
          verzoegerung={300}
        />
        <SchwebenderStern
          x={width * 0.85}
          y={15}
          groesse={12}
          verzoegerung={600}
        />
        <View style={styles.lichtstrahl1} />
        <TouchableOpacity style={styles.magiBtn} onPress={() => router.back()}>
          <Text style={styles.magiBtnText}>🪄 Magi</Text>
        </TouchableOpacity>
        <Animated.View
          style={[
            { alignItems: "center" },
            { transform: [{ translateY: logoAnim }] },
          ]}
        >
          <Animated.Text
            style={[
              { fontSize: 50 },
              { transform: [{ translateY: bounceAnim }] },
            ]}
          >
            💎
          </Animated.Text>
          <Text style={styles.logoText}>Schatzkammer</Text>
          <Text style={styles.logoUnter}>
            Fragen beantworten & Kristalle sammeln!
          </Text>
        </Animated.View>
        <View style={styles.dekoZeile}>
          <Text style={{ fontSize: 20 }}>✨</Text>
          <Text style={{ fontSize: 24 }}>💎</Text>
          <Text style={{ fontSize: 20 }}>✨</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hauptBereich}>
          {/* Kristall Anzeige */}
          <View style={styles.kristallBox}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                gap: 8,
                marginBottom: 14,
              }}
            >
              <Text style={styles.kristallZahl}>{kristalle.anzahl}</Text>
              <Text
                style={{ fontSize: 15, color: "#9B8FC0", fontWeight: "600" }}
              >
                / 10 Kristalle
              </Text>
            </View>
            <View style={styles.kristallBalkenGross}>
              {Array.from({ length: 10 }).map((_, i) => (
                <View key={i} style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: i < kristalle.anzahl ? 18 : 13 }}>
                    {i < kristalle.anzahl ? "💎" : "○"}
                  </Text>
                </View>
              ))}
            </View>
            {kristalle.anzahl >= 10 ? (
              <TouchableOpacity
                style={styles.filmButtonGross}
                onPress={() => setModus("film")}
              >
                <Text style={styles.filmButtonGrossText}>
                  🎬 Film freischalten!
                </Text>
              </TouchableOpacity>
            ) : (
              <Text
                style={{
                  fontSize: 12,
                  color: "#9B8FC0",
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                Noch {10 - kristalle.anzahl} Kristalle bis zum Zauberfilm! 🎬
              </Text>
            )}
          </View>

          <Text style={styles.auswahlTitel}>
            📖 Wähle eine Geschichte für das Quiz:
          </Text>

          {geschichten.length === 0 ? (
            <View style={styles.leerBox}>
              <Text style={{ fontSize: 45, textAlign: "center" }}>📚</Text>
              <Text style={styles.leerText}>
                Erst eine Geschichte liken um das Quiz zu starten!
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10, marginBottom: 16 }}>
              {geschichten.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[
                    styles.geschichteKarte,
                    { borderLeftColor: GENRE_FARBE[g.genre] || "#888" },
                  ]}
                  onPress={() => {
                    setAktuelleGeschichte(g);
                    erstelleFragen(g);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.geschichteTitel}>{g.titel}</Text>
                    <Text style={styles.geschichteMeta}>
                      {GENRE_EMOJI[g.genre]} {g.genre} • {g.datum}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 22,
                      color: GENRE_FARBE[g.genre] || "#888",
                    }}
                  >
                    ▶
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {laedt && (
            <View style={styles.ladeBox}>
              <Text style={{ fontSize: 30 }}>🤔</Text>
              <Text style={styles.ladeText}>Fragen werden erstellt...</Text>
            </View>
          )}
          <View style={{ height: 30 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  himmel: {
    backgroundColor: "#1A0A3A",
    paddingTop: 50,
    paddingBottom: 16,
    alignItems: "center",
    position: "relative",
    minHeight: height * 0.3,
  },
  lichtstrahl1: {
    position: "absolute",
    top: 0,
    left: width * 0.3,
    width: 3,
    height: "100%",
    backgroundColor: "rgba(180,130,255,0.08)",
    transform: [{ rotate: "10deg" }],
  },
  magiBtn: {
    position: "absolute",
    top: 50,
    left: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 10,
  },
  magiBtnText: { color: "white", fontSize: 13, fontWeight: "700" },
  logoText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFD700",
    textShadowColor: "rgba(255,180,0,0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    marginTop: 6,
  },
  logoUnter: {
    fontSize: 12,
    color: "rgba(200,180,255,0.9)",
    fontWeight: "600",
    marginTop: 3,
    textAlign: "center",
  },
  dekoZeile: { flexDirection: "row", gap: 10, marginTop: 10 },
  hauptBereich: {
    backgroundColor: "#F0E8FF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
    paddingTop: 16,
    paddingHorizontal: 14,
  },
  kristallBox: {
    backgroundColor: "#2D0A5A",
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#5A3A8A",
    elevation: 6,
  },
  kristallZahl: { fontSize: 44, fontWeight: "900", color: "#FFD700" },
  kristallBalkenGross: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 10,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  filmButtonGross: {
    backgroundColor: "#E8A020",
    borderRadius: 18,
    paddingHorizontal: 26,
    paddingVertical: 12,
    elevation: 4,
    marginTop: 8,
  },
  filmButtonGrossText: { color: "white", fontSize: 16, fontWeight: "900" },
  auswahlTitel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#4A2A7A",
    marginBottom: 10,
  },
  leerBox: {
    backgroundColor: "#2D0A5A",
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#5A3A8A",
    marginBottom: 12,
  },
  leerText: {
    fontSize: 14,
    color: "#9B8FC0",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 20,
  },
  geschichteKarte: {
    backgroundColor: "#2D0A5A",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 5,
    borderWidth: 1,
    borderColor: "#5A3A8A",
  },
  geschichteTitel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#E8D5FF",
    marginBottom: 4,
  },
  geschichteMeta: { fontSize: 11, color: "#9B8FC0" },
  ladeBox: {
    backgroundColor: "#2D0A5A",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#5A3A8A",
  },
  ladeText: { fontSize: 15, fontWeight: "700", color: "#E8D5FF", marginTop: 8 },
  quizHeader: {
    padding: 20,
    paddingTop: 50,
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: "relative",
  },
  quizHeaderText: {
    fontSize: 17,
    fontWeight: "800",
    color: "white",
    marginBottom: 10,
    marginTop: 8,
  },
  quizFortschritt: { flexDirection: "row", gap: 8 },
  quizPunkt: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  quizBox: {
    margin: 14,
    backgroundColor: "#2D0A5A",
    borderRadius: 22,
    padding: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#5A3A8A",
  },
  quizFrage: {
    fontSize: 18,
    fontWeight: "800",
    color: "#E8D5FF",
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 18,
  },
  quizAntworten: { gap: 10 },
  antwortButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  antwortBuchstabe: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    textAlign: "center",
    lineHeight: 28,
    fontWeight: "900",
    fontSize: 13,
    color: "#E8D5FF",
  },
  antwortText: { flex: 1, fontSize: 15, fontWeight: "600", color: "#E8D5FF" },
  belohnungBox: {
    backgroundColor: "#2D0A5A",
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#5A3A8A",
  },
  belohnungTitel: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFD700",
    marginTop: 10,
    textAlign: "center",
  },
  belohnungUnter: { fontSize: 15, color: "#9B8FC0", marginTop: 6 },
  belohnungKristallText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFD700",
    marginTop: 8,
  },
  kristallStand: { marginTop: 18, alignItems: "center", width: "100%" },
  kristallStandText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#C0A0FF",
    marginBottom: 10,
  },
  kristallBalken: { flexDirection: "row", gap: 5 },
  kristallPunkt: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "#5A3A8A",
  },
  kristallPunktAktiv: { backgroundColor: "#FFD700" },
  filmButton: {
    backgroundColor: "#E8A020",
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 11,
    marginTop: 14,
    elevation: 4,
  },
  filmButtonText: { color: "white", fontSize: 15, fontWeight: "900" },
  magiZurueckBtn: {
    backgroundColor: "#7B3FA0",
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 11,
    marginTop: 12,
    elevation: 4,
  },
  magiZurueckText: { color: "white", fontSize: 14, fontWeight: "900" },
  filmBox: {
    backgroundColor: "#2D0A5A",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#5A3A8A",
  },
  filmTitel: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFD700",
    textAlign: "center",
  },
  filmText: {
    fontSize: 14,
    color: "#9B8FC0",
    marginTop: 6,
    textAlign: "center",
  },
  filmKarte: {
    backgroundColor: "#1A0A3A",
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#5A3A8A",
  },
  filmKarteText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E8D5FF",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 8,
  },
  filmKarteUnter: { fontSize: 12, color: "#9B8FC0", marginTop: 6 },
  filmSzenen: { gap: 7, marginTop: 14, width: "100%" },
  filmSzene: {
    backgroundColor: "#1A0A3A",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#5A3A8A",
  },
  filmSzeneText: { fontSize: 14, fontWeight: "700", color: "#E8D5FF" },
});
