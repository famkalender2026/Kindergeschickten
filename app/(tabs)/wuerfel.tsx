import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

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
const GENRES = Object.keys(GENRE_FARBE);
const AKTEURE = [
  "ein mutiger Drache",
  "eine neugierige Katze",
  "ein kleiner Roboter",
  "eine weise Eule",
  "ein frecher Affe",
  "ein tapferer Ritter",
  "eine magische Fee",
  "ein schlauer Fuchs",
  "ein kleines Kaninchen",
  "ein freundlicher Dino",
];
const DAUER = ["2", "5", "10"];

function bildUrl(akteur: string, genre: string): string {
  const prompt = `3D cartoon pixar style, cute chubby ${akteur} character, ${genre} children book cover, magical background, vibrant colors, professional illustration`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=600&height=350&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
}

function teileInSeiten(text: string, worterProSeite = 80): string[] {
  const woerter = text.split(" ");
  const seiten: string[] = [];
  for (let i = 0; i < woerter.length; i += worterProSeite) {
    seiten.push(woerter.slice(i, i + worterProSeite).join(" "));
  }
  return seiten.length > 0 ? seiten : [text];
}

export default function WuerfelScreen() {
  const [modus, setModus] = useState<"start" | "wuerfeln" | "lesen">("start");
  const [aktuellerGenre, setAktuellerGenre] = useState("");
  const [aktuellerAkteur, setAktuellerAkteur] = useState("");
  const [geschichte, setGeschichte] = useState("");
  const [laedt, setLaedt] = useState(false);
  const [seiten, setSeiten] = useState<string[]>([]);
  const [aktuelleSeite, setAktuelleSeite] = useState(0);
  const [bildUri, setBildUri] = useState("");
  const [sprichtGerade, setSprichtGerade] = useState(false);

  const wuerfelAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const wuerfeln = async () => {
    setModus("wuerfeln");
    setLaedt(true);
    setGeschichte("");

    Animated.loop(
      Animated.timing(wuerfelAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ).start();

    const zufallGenre = GENRES[Math.floor(Math.random() * GENRES.length)];
    const zufallAkteur = AKTEURE[Math.floor(Math.random() * AKTEURE.length)];
    const zufallDauer = DAUER[Math.floor(Math.random() * DAUER.length)];

    setAktuellerGenre(zufallGenre);
    setAktuellerAkteur(zufallAkteur);
    setBildUri(bildUrl(zufallAkteur, zufallGenre));

    const prompt = `Schreibe eine überraschende und magische Kindergeschichte auf Deutsch. Akteur: ${zufallAkteur}. Genre: ${zufallGenre}. Sei kreativ und unerwartet! Gib einen aufregenden Titel mit ** darum. Ca. ${zufallDauer} Minuten Lesezeit. Beginne direkt mit dem Titel.`;

    try {
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
            max_tokens: 2000,
          }),
        },
      );
      const daten = await antwort.json();
      const text = daten.choices[0].message.content;
      setGeschichte(text);
      const seitenArray = teileInSeiten(text, 80);
      setSeiten(seitenArray);
      setAktuelleSeite(0);
      wuerfelAnim.stopAnimation();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
      setModus("lesen");
    } catch {
      alert("Fehler! Versuche es nochmal.");
      setModus("start");
    }
    setLaedt(false);
  };

  const blatterUm = (richtung: "vor" | "zuruck") => {
    stoppeAudio();
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: richtung === "vor" ? -60 : 60,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    setAktuelleSeite((prev) =>
      richtung === "vor"
        ? Math.min(prev + 1, seiten.length - 1)
        : Math.max(prev - 1, 0),
    );
  };

  const starteAudio = () => {
    if (typeof window === "undefined") return;
    const synth = (window as any).speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utterance = new (window as any).SpeechSynthesisUtterance(
      seiten[aktuelleSeite] || "",
    );
    utterance.lang = "de-DE";
    utterance.rate = 0.78;
    utterance.pitch = 1.2;
    const stimmen = synth.getVoices();
    const deutscheStimme =
      stimmen.find((s: any) => s.lang === "de-DE") ||
      stimmen.find((s: any) => s.lang.startsWith("de"));
    if (deutscheStimme) utterance.voice = deutscheStimme;
    utterance.onend = () => {
      setSprichtGerade(false);
      if (aktuelleSeite < seiten.length - 1)
        setTimeout(() => blatterUm("vor"), 600);
    };
    utterance.onerror = () => setSprichtGerade(false);
    synth.speak(utterance);
    setSprichtGerade(true);
  };

  const stoppeAudio = () => {
    if (typeof window === "undefined") return;
    const synth = (window as any).speechSynthesis;
    if (synth) synth.cancel();
    setSprichtGerade(false);
  };

  const titel =
    geschichte.match(/\*\*(.*?)\*\*/)?.[1] || "Überraschungsgeschichte";
  const farbe = GENRE_FARBE[aktuellerGenre] || "#FF6B35";
  const istErsteSeite = aktuelleSeite === 0;
  const istLetzteSeite = aktuelleSeite === seiten.length - 1;

  // WUERFELN SCREEN
  if (modus === "wuerfeln") {
    return (
      <View style={styles.wuerfelContainer}>
        <Text style={{ fontSize: 90, textAlign: "center" }}>🎲</Text>
        <Text style={styles.wuerfelLadeText}>Die Würfel fallen...</Text>
        <Text style={styles.wuerfelLadeUnter}>
          Eine Überraschung entsteht! ✨
        </Text>
        {aktuellerGenre && (
          <View style={[styles.wuerfelErgebnis, { backgroundColor: farbe }]}>
            <Text style={styles.wuerfelErgebnisText}>
              {GENRE_EMOJI[aktuellerGenre]} {aktuellerGenre}
            </Text>
            <Text style={styles.wuerfelErgebnisUnter}>{aktuellerAkteur}</Text>
          </View>
        )}
      </View>
    );
  }

  // LESEN SCREEN
  if (modus === "lesen") {
    return (
      <View style={{ flex: 1, backgroundColor: "#FFF9F0" }}>
        <View style={[styles.leseHeaderBar, { backgroundColor: farbe }]}>
          <TouchableOpacity
            style={styles.zurueckBtn}
            onPress={() => {
              stoppeAudio();
              setModus("start");
              fadeAnim.setValue(0);
            }}
          >
            <Text style={styles.zurueckText}>🎲 Neu würfeln</Text>
          </TouchableOpacity>
          <Text style={styles.leseTitelBar} numberOfLines={1}>
            {titel}
          </Text>
          <Text style={styles.seitenBadge}>
            {aktuelleSeite + 1}/{seiten.length}
          </Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.ueberraschungsBanner}>
              <Text style={styles.ueberraschungsBannerText}>
                🎲 Zufallsgeschichte • {GENRE_EMOJI[aktuellerGenre]}{" "}
                {aktuellerGenre}
              </Text>
            </View>
            {bildUri && (
              <View style={styles.bildRahmen}>
                <Image
                  source={{ uri: bildUri }}
                  style={styles.seitenBild}
                  resizeMode="cover"
                />
                <View
                  style={[styles.bildGlanz, { backgroundColor: farbe + "44" }]}
                />
              </View>
            )}
            <View style={styles.audioLeiste}>
              <TouchableOpacity
                style={[
                  styles.audioButton,
                  { backgroundColor: sprichtGerade ? "#E74C3C" : "#FF8C00" },
                ]}
                onPress={sprichtGerade ? stoppeAudio : starteAudio}
              >
                <Text style={{ fontSize: 22 }}>
                  {sprichtGerade ? "⏹️" : "🔊"}
                </Text>
                <Text style={styles.audioText}>
                  {sprichtGerade ? "Stoppen" : "Vorlesen"}
                </Text>
              </TouchableOpacity>
            </View>
            <Animated.View
              style={[
                styles.buchSeite,
                { transform: [{ translateX: slideAnim }] },
              ]}
            >
              {aktuelleSeite === 0 && (
                <Text style={[styles.anfuehrung, { color: farbe }]}>"</Text>
              )}
              <Text style={styles.buchText}>{seiten[aktuelleSeite]}</Text>
              {istLetzteSeite && <Text style={styles.ende}>~ Ende ~</Text>}
            </Animated.View>
            <View style={styles.navigationLeiste}>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  { backgroundColor: istErsteSeite ? "#DDD" : "#FF8C00" },
                ]}
                onPress={() => blatterUm("zuruck")}
                disabled={istErsteSeite}
              >
                <Text style={styles.navPfeil}>◀</Text>
                <Text
                  style={[
                    styles.navText,
                    { color: istErsteSeite ? "#999" : "white" },
                  ]}
                >
                  Zurück
                </Text>
              </TouchableOpacity>
              <View style={styles.seitenPunkte}>
                {seiten.slice(0, 8).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.punkt,
                      i === aktuelleSeite && {
                        backgroundColor: farbe,
                        width: 18,
                        height: 10,
                      },
                    ]}
                  />
                ))}
              </View>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  { backgroundColor: istLetzteSeite ? "#DDD" : "#FF8C00" },
                ]}
                onPress={() => blatterUm("vor")}
                disabled={istLetzteSeite}
              >
                <Text
                  style={[
                    styles.navText,
                    { color: istLetzteSeite ? "#999" : "white" },
                  ]}
                >
                  Weiter
                </Text>
                <Text style={styles.navPfeil}>▶</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.neueButton, { backgroundColor: farbe }]}
              onPress={() => {
                stoppeAudio();
                setModus("start");
                fadeAnim.setValue(0);
              }}
            >
              <Text style={styles.neueButtonText}>🎲 Neu würfeln!</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // START SCREEN
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Animated.Text
          style={[styles.headerEmoji, { transform: [{ scale: pulseAnim }] }]}
        >
          🎲
        </Animated.Text>
        <Text style={styles.headerTitel}>Zauberwürfel</Text>
        <Text style={styles.headerUnter}>
          Eine zufällige Geschichte wartet auf dich!
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitel}>✨ Wie funktioniert es?</Text>
        <Text style={styles.infoText}>
          Tippe auf "Würfeln!" und die KI erstellt eine völlig zufällige
          Überraschungsgeschichte – du weißt nie was kommt!
        </Text>
        <View style={styles.infoGrid}>
          {[
            ["🎭", "Zufalls-Genre"],
            ["🦸", "Zufalls-Held"],
            ["⏱️", "Zufalls-Länge"],
          ].map(([emoji, text]) => (
            <View key={text} style={styles.infoKarte}>
              <Text style={{ fontSize: 28 }}>{emoji}</Text>
              <Text style={styles.infoKarteText}>{text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.genreVorschau}>
        <Text style={styles.genreVorschauTitel}>Mögliche Genres:</Text>
        <View style={styles.genreVorschauGrid}>
          {GENRES.map((g) => (
            <View
              key={g}
              style={[
                styles.genreVorschauChip,
                { backgroundColor: GENRE_FARBE[g] },
              ]}
            >
              <Text style={{ fontSize: 20 }}>{GENRE_EMOJI[g]}</Text>
              <Text style={styles.genreVorschauText}>{g}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.wuerfelButton} onPress={wuerfeln}>
        <Text style={styles.wuerfelButtonEmoji}>🎲</Text>
        <Text style={styles.wuerfelButtonText}>Würfeln!</Text>
        <Text style={styles.wuerfelButtonUnter}>Überraschung!</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0FFF4" },
  header: {
    backgroundColor: "#6A1B9A",
    padding: 28,
    alignItems: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerEmoji: { fontSize: 70, marginBottom: 8 },
  headerTitel: { fontSize: 28, fontWeight: "900", color: "white" },
  headerUnter: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    textAlign: "center",
  },
  infoBox: {
    backgroundColor: "white",
    borderRadius: 24,
    margin: 14,
    padding: 20,
    elevation: 4,
  },
  infoTitel: {
    fontSize: 18,
    fontWeight: "800",
    color: "#6A1B9A",
    marginBottom: 8,
  },
  infoText: { fontSize: 14, color: "#666", lineHeight: 22 },
  infoGrid: { flexDirection: "row", gap: 10, marginTop: 16 },
  infoKarte: {
    flex: 1,
    backgroundColor: "#F3E5F5",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 6,
  },
  infoKarteText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6A1B9A",
    textAlign: "center",
  },
  genreVorschau: { paddingHorizontal: 14, marginBottom: 8 },
  genreVorschauTitel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#555",
    marginBottom: 10,
  },
  genreVorschauGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  genreVorschauChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  genreVorschauText: { fontSize: 13, fontWeight: "700", color: "white" },
  wuerfelButton: {
    backgroundColor: "#6A1B9A",
    borderRadius: 28,
    margin: 14,
    padding: 28,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#6A1B9A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  wuerfelButtonEmoji: { fontSize: 60, marginBottom: 8 },
  wuerfelButtonText: { fontSize: 32, fontWeight: "900", color: "white" },
  wuerfelButtonUnter: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  wuerfelContainer: {
    flex: 1,
    backgroundColor: "#6A1B9A",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  wuerfelLadeText: {
    fontSize: 24,
    fontWeight: "900",
    color: "white",
    marginTop: 20,
  },
  wuerfelLadeUnter: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    marginTop: 8,
  },
  wuerfelErgebnis: {
    borderRadius: 20,
    padding: 16,
    marginTop: 24,
    alignItems: "center",
    minWidth: 200,
  },
  wuerfelErgebnisText: { fontSize: 20, fontWeight: "900", color: "white" },
  wuerfelErgebnisUnter: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  leseHeaderBar: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leseTitelBar: {
    fontSize: 16,
    fontWeight: "800",
    color: "white",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  seitenBadge: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
  zurueckBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  zurueckText: { color: "white", fontSize: 14, fontWeight: "700" },
  ueberraschungsBanner: {
    backgroundColor: "#6A1B9A",
    margin: 14,
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
  },
  ueberraschungsBannerText: { color: "white", fontSize: 14, fontWeight: "700" },
  bildRahmen: {
    margin: 14,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 6,
  },
  seitenBild: { width: "100%", height: Math.min(width * 0.6, 280) },
  bildGlanz: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  audioLeiste: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
    marginBottom: 8,
  },
  audioButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    elevation: 4,
  },
  audioText: { color: "white", fontSize: 15, fontWeight: "800" },
  buchSeite: {
    backgroundColor: "#FFFFF0",
    borderRadius: 24,
    padding: Math.min(width * 0.06, 24),
    margin: 14,
    borderWidth: 2.5,
    borderColor: "#A8E063",
    elevation: 3,
  },
  anfuehrung: {
    fontSize: Math.min(width * 0.18, 80),
    lineHeight: Math.min(width * 0.16, 70),
    fontWeight: "900",
  },
  buchText: {
    fontSize: Math.min(width * 0.045, 18),
    lineHeight: Math.min(width * 0.08, 34),
    color: "#2D3A1E",
    textAlign: "justify",
  },
  ende: {
    textAlign: "center",
    color: "#6B8E23",
    fontStyle: "italic",
    fontSize: 17,
    marginTop: 24,
    fontWeight: "600",
  },
  navigationLeiste: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
    elevation: 3,
    gap: 6,
  },
  navPfeil: { fontSize: 16, color: "white" },
  navText: { fontSize: 14, fontWeight: "800" },
  seitenPunkte: { flexDirection: "row", gap: 6, alignItems: "center" },
  punkt: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#CCC" },
  neueButton: {
    borderRadius: 24,
    padding: 18,
    alignItems: "center",
    margin: 14,
    marginBottom: 30,
    elevation: 5,
  },
  neueButtonText: { color: "white", fontSize: 18, fontWeight: "900" },
});
