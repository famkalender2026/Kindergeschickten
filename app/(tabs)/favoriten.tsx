import {
    Geschichte,
    ladeAlleGeschichten,
    ladeLesefortschritt,
    loescheLesefortschritt,
    speichereLesefortschritt,
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

function teileInSeiten(text: string, worterProSeite = 80): string[] {
  const woerter = text.split(" ");
  const seiten: string[] = [];
  for (let i = 0; i < woerter.length; i += worterProSeite) {
    seiten.push(woerter.slice(i, i + worterProSeite).join(" "));
  }
  return seiten.length > 0 ? seiten : [text];
}

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

export default function FavoritenScreen() {
  const router = useRouter();
  const [gruppiertNachGenre, setGruppiertNachGenre] = useState<
    Record<string, Geschichte[]>
  >({});
  const [ausgewaehlt, setAusgewaehlt] = useState<Geschichte | null>(null);
  const [aktiveGenre, setAktiveGenre] = useState<string | null>(null);
  const [seiten, setSeiten] = useState<string[]>([]);
  const [aktuelleSeite, setAktuelleSeite] = useState(0);
  const [sprichtGerade, setSprichtGerade] = useState(false);
  const [fortschritt, setFortschritt] = useState<any>(null);
  const [wischStart, setWischStart] = useState(0);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const zauberAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
    Animated.loop(
      Animated.timing(zauberAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      ladeDaten();
      ladeFortschritt();
    }, []),
  );

  const ladeDaten = async () => {
    const alle = await ladeAlleGeschichten();
    const lieblinge = alle.filter((g) => g.bewertung === "gut");
    const gruppen: Record<string, Geschichte[]> = {};
    lieblinge.forEach((g) => {
      if (!gruppen[g.genre]) gruppen[g.genre] = [];
      gruppen[g.genre].push(g);
    });
    setGruppiertNachGenre(gruppen);
    fadeIn.setValue(0);
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const ladeFortschritt = async () => {
    const f = await ladeLesefortschritt();
    setFortschritt(f);
  };

  const oeffneGeschichte = (g: Geschichte, startSeite = 0) => {
    const seitenArray = teileInSeiten(g.text, 80);
    setSeiten(seitenArray);
    setAktuelleSeite(startSeite);
    setAusgewaehlt(g);
    fadeIn.setValue(0);
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const blatterUm = (richtung: "vor" | "zuruck") => {
    stoppeAudio();
    const neueSeite =
      richtung === "vor"
        ? Math.min(aktuelleSeite + 1, seiten.length - 1)
        : Math.max(aktuelleSeite - 1, 0);
    const ziel = richtung === "vor" ? -width * 0.8 : width * 0.8;
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: ziel,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();
    setAktuelleSeite(neueSeite);
    if (ausgewaehlt) {
      speichereLesefortschritt({
        geschichteId: ausgewaehlt.id,
        titel: ausgewaehlt.titel,
        genre: ausgewaehlt.genre,
        aktuelleSeite: neueSeite,
        gesamtSeiten: seiten.length,
        datum: new Date().toLocaleDateString("de-DE"),
      });
    }
  };

  const stoppeAudio = () => {
    if (typeof window === "undefined") return;
    const synth = (window as any).speechSynthesis;
    if (synth) synth.cancel();
    setSprichtGerade(false);
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

  const alleGenres = Object.keys(gruppiertNachGenre).sort();
  const gesamtAnzahl = Object.values(gruppiertNachGenre).reduce(
    (s, arr) => s + arr.length,
    0,
  );
  const zauberRotation = zauberAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // ═══ LESE SCREEN ═══
  if (ausgewaehlt) {
    const farbe = GENRE_FARBE[ausgewaehlt.genre] || "#9B59B6";
    const istErsteSeite = aktuelleSeite === 0;
    const istLetzteSeite = aktuelleSeite === seiten.length - 1;
    const seitenJson = JSON.stringify(seiten);

    let WebViewComponent: any = null;
    try {
      WebViewComponent = require("react-native-webview").WebView;
    } catch {}

    const html = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#0D0625; font-family:'Georgia',serif; overflow:hidden; height:100vh; display:flex; flex-direction:column; }
.buch-welt { flex:1; display:flex; perspective:2000px; background:linear-gradient(135deg,#1A0A3A 0%,#0D0625 100%); padding:6px; }
.buch { flex:1; display:flex; border-radius:4px 12px 12px 4px; box-shadow:-8px 0 30px rgba(0,0,0,0.8),0 20px 60px rgba(0,0,0,0.6); }
.seite-links { flex:1; background:linear-gradient(to right,#E8E0D0,#F5F0E8); border-radius:4px 0 0 4px; overflow:hidden; }
.seite-links-inhalt { padding:12px 10px 10px 12px; height:100%; display:flex; flex-direction:column; opacity:0.5; filter:blur(0.5px); }
.seite-links-text { font-size:11px; line-height:1.6; color:#999; flex:1; overflow:hidden; }
.seite-links-nr { text-align:center; font-size:10px; color:#BBB; margin-top:6px; font-style:italic; }
.buchruecken { width:16px; background:linear-gradient(to right,#1A0A30,#2D1A4A,#1A0A30); position:relative; z-index:10; box-shadow:2px 0 8px rgba(0,0,0,0.5),-2px 0 8px rgba(0,0,0,0.5); }
.seite-rechts-container { flex:1; position:relative; }
.seite-rechts { position:absolute; inset:0; background:linear-gradient(135deg,#FFFEF5 0%,#FFF8E7 100%); border-radius:0 12px 12px 0; display:flex; flex-direction:column; transform-origin:left center; overflow:hidden; box-shadow:4px 0 20px rgba(0,0,0,0.3); transition:box-shadow 0.1s; }
.seite-flipping { position:absolute; inset:0; background:linear-gradient(135deg,#FFFEF5 0%,#FFF8E7 100%); border-radius:0 12px 12px 0; transform-origin:left center; display:flex; flex-direction:column; overflow:hidden; z-index:100; }
.seite-flipping-rueck { position:absolute; inset:0; background:linear-gradient(135deg,#F0EBE0,#E8E0D0); border-radius:0 12px 12px 0; transform:rotateY(180deg); backface-visibility:hidden; display:flex; align-items:center; justify-content:center; font-size:36px; }
.seite-kopf { display:flex; justify-content:space-between; align-items:center; padding:6px 12px; font-size:11px; font-weight:700; }
.trennlinie { height:1px; margin:0 12px; }
.seite-text-bereich { flex:1; padding:10px 14px; overflow:hidden; font-size:13px; line-height:1.75; color:#2D3A1E; text-align:justify; }
.anfuehrung { font-size:48px; line-height:0.8; font-weight:900; margin-bottom:-8px; }
.ende-text { text-align:center; color:#6B8E23; font-style:italic; font-size:12px; margin-top:14px; }
.seite-fuss { padding:5px 12px 8px; }
.fuss-zeile { display:flex; justify-content:space-between; align-items:center; }
.blatter-pfeil { font-size:26px; font-weight:900; padding:4px 8px; cursor:pointer; user-select:none; opacity:0.8; }
.blatter-pfeil.deaktiviert { opacity:0.15; }
.seiten-nr { text-align:center; font-size:11px; font-weight:700; font-style:italic; }
.fortschritt-balken { height:3px; background:rgba(0,0,0,0.1); border-radius:2px; margin-top:3px; overflow:hidden; }
.fortschritt-fill { height:100%; border-radius:2px; transition:width 0.5s ease; }
.seiten-rand { position:absolute; right:0; top:0; bottom:0; width:5px; background:repeating-linear-gradient(to bottom,#E8E0D0,#E8E0D0 4px,#D8D0C0 4px,#D8D0C0 8px); border-radius:0 12px 12px 0; }
.flip-schatten { position:absolute; inset:0; background:linear-gradient(to right,rgba(0,0,0,0.4),transparent); pointer-events:none; opacity:0; z-index:50; }
.ende-box { background:linear-gradient(135deg,#2D0A5A,#1A0A3A); padding:12px 14px; border-top:1px solid rgba(123,63,160,0.5); display:none; }
.ende-box.sichtbar { display:flex; justify-content:center; gap:10px; }
.ende-btn { display:flex; flex-direction:column; align-items:center; padding:8px 12px; border-radius:14px; background:#7B3FA0; cursor:pointer; font-family:sans-serif; transition:transform 0.15s; }
.ende-btn:active { transform:scale(0.9); }
.ende-btn-text { font-size:10px; color:white; margin-top:2px; font-weight:700; }
.wisch-hinweis { position:absolute; bottom:50px; left:50%; transform:translateX(-50%); background:rgba(123,63,160,0.85); color:white; font-size:11px; padding:4px 14px; border-radius:20px; pointer-events:none; font-family:sans-serif; white-space:nowrap; transition:opacity 1s; }
.wisch-hinweis.ausgeblendet { opacity:0; }
</style>
</head>
<body>
<div class="buch-welt">
  <div class="buch">
    <div class="seite-links">
      <div class="seite-links-inhalt">
        <div class="seite-links-text" id="links-text"></div>
        <div class="seite-links-nr" id="links-nr"></div>
      </div>
    </div>
    <div class="buchruecken"></div>
    <div class="seite-rechts-container" id="flip-container">
      <div class="seite-rechts" id="seite-aktuell">
        <div class="seite-kopf" id="seite-kopf">
          <span id="genre-label"></span>
          <span id="seiten-label"></span>
        </div>
        <div class="trennlinie" id="trennlinie"></div>
        <div class="seite-text-bereich" id="seite-text"></div>
        <div class="seite-fuss">
          <div class="fuss-zeile">
            <span class="blatter-pfeil" id="pfeil-links" onclick="blattereZurueck()">‹</span>
            <div>
              <div class="seiten-nr" id="seiten-nr-unten"></div>
              <div class="fortschritt-balken"><div class="fortschritt-fill" id="fortschritt"></div></div>
            </div>
            <span class="blatter-pfeil" id="pfeil-rechts" onclick="blattereVor()">›</span>
          </div>
        </div>
        <div class="seiten-rand"></div>
        <div class="flip-schatten" id="flip-schatten"></div>
      </div>
      <div class="seite-flipping" id="seite-flipping" style="display:none">
        <div style="display:flex;flex-direction:column;height:100%">
          <div class="seite-kopf" id="flip-kopf"></div>
          <div class="trennlinie"></div>
          <div class="seite-text-bereich" id="flip-text"></div>
          <div class="seite-fuss"><div class="seiten-nr" id="flip-nr"></div></div>
        </div>
        <div class="seiten-rand"></div>
        <div class="seite-flipping-rueck">✨</div>
      </div>
    </div>
  </div>
</div>
<div class="ende-box" id="ende-box">
  <div class="ende-btn" onclick="geheZurueck()">
    <span style="font-size:18px">🪄</span>
    <span class="ende-btn-text">Magi</span>
  </div>
  <div class="ende-btn" onclick="geheZurueckFavoriten()" style="background:#E74C3C">
    <span style="font-size:18px">⭐</span>
    <span class="ende-btn-text">Favoriten</span>
  </div>
</div>
<div class="wisch-hinweis" id="wisch-hinweis">👆 Finger ziehen zum Umblättern</div>
<script>
const SEITEN = ${seitenJson};
const FARBE = "${farbe}";
const GNAME = "${ausgewaehlt.genre}";
const GEMOJI = "${GENRE_EMOJI[ausgewaehlt.genre] || "📖"}";
let aktuelleSeite = ${aktuelleSeite};
let istFlipping = false;
let fingerStart = null;
let fingerAktuell = null;

const dynStyle = document.createElement('style');
dynStyle.textContent = \`
  .buchruecken::after{content:'';position:absolute;left:6px;top:0;bottom:0;width:4px;background:linear-gradient(to bottom,transparent,\${FARBE},transparent);opacity:0.6;}
  .seite-kopf{background:\${FARBE}22!important;color:\${FARBE}!important;}
  .trennlinie{background:\${FARBE}33!important;}
  .blatter-pfeil{color:\${FARBE}!important;}
  .seiten-nr{color:\${FARBE}!important;}
  .fortschritt-fill{background:\${FARBE}!important;}
  .seite-fuss{border-top:1px solid \${FARBE}33;}
  .anfuehrung{color:\${FARBE}!important;}
\`;
document.head.appendChild(dynStyle);

function zeigeSeite(nr) {
  const seite = SEITEN[nr];
  const istErste = nr === 0;
  const istLetzte = nr === SEITEN.length - 1;
  document.getElementById('genre-label').textContent = GEMOJI + ' ' + GNAME;
  document.getElementById('seiten-label').textContent = 'Seite ' + (nr + 1);
  const textEl = document.getElementById('seite-text');
  textEl.innerHTML = (istErste ? '<div class="anfuehrung">\u201C</div>' : '') +
    '<div>' + seite.replace(/\\n/g,'<br>') + '</div>' +
    (istLetzte ? '<div class="ende-text">~ Ende ~</div>' : '');
  document.getElementById('seiten-nr-unten').textContent = '— ' + (nr+1) + ' / ' + SEITEN.length + ' —';
  document.getElementById('fortschritt').style.width = ((nr+1)/SEITEN.length*100) + '%';
  document.getElementById('pfeil-links').classList.toggle('deaktiviert', nr === 0);
  document.getElementById('pfeil-rechts').classList.toggle('deaktiviert', nr === SEITEN.length-1);
  if (nr > 0) { document.getElementById('links-text').textContent = SEITEN[nr-1]; document.getElementById('links-nr').textContent = '— ' + nr + ' —'; }
  else { document.getElementById('links-text').textContent = ''; document.getElementById('links-nr').textContent = ''; }
  document.getElementById('ende-box').classList.toggle('sichtbar', istLetzte);
}

function blattereVor() { if (aktuelleSeite >= SEITEN.length-1 || istFlipping) return; animiere('vor'); }
function blattereZurueck() { if (aktuelleSeite <= 0 || istFlipping) return; animiere('zuruck'); }

function animiere(richtung) {
  if (istFlipping) return;
  istFlipping = true;
  const naechste = richtung === 'vor' ? aktuelleSeite+1 : aktuelleSeite-1;
  const flipEl = document.getElementById('seite-flipping');
  const schatten = document.getElementById('flip-schatten');
  document.getElementById('flip-kopf').textContent = GEMOJI + ' ' + GNAME + ' • Seite ' + (aktuelleSeite+1);
  document.getElementById('flip-text').innerHTML = document.getElementById('seite-text').innerHTML;
  document.getElementById('flip-nr').textContent = '— ' + (aktuelleSeite+1) + ' / ' + SEITEN.length + ' —';
  flipEl.style.display = 'flex'; flipEl.style.transition = 'none'; flipEl.style.transform = 'rotateY(0deg)'; schatten.style.opacity = '0';
  setTimeout(() => {
    zeigeSeite(naechste);
    flipEl.style.transition = 'transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94),box-shadow 0.45s';
    flipEl.style.transform = richtung === 'vor' ? 'rotateY(-180deg)' : 'rotateY(180deg)';
    flipEl.style.boxShadow = richtung === 'vor' ? '-20px 0 60px rgba(0,0,0,0.5)' : '20px 0 60px rgba(0,0,0,0.5)';
    schatten.style.transition = 'opacity 0.45s'; schatten.style.opacity = '0.3';
    setTimeout(() => {
      flipEl.style.display = 'none'; flipEl.style.transition = 'none'; schatten.style.opacity = '0';
      aktuelleSeite = naechste; istFlipping = false;
      try { window.ReactNativeWebView.postMessage(JSON.stringify({typ:'seite',wert:naechste})); } catch(e) {}
    }, 460);
  }, 10);
}

const container = document.getElementById('flip-container');
container.addEventListener('touchstart', (e) => { fingerStart = e.touches[0].clientX; fingerAktuell = fingerStart; document.getElementById('wisch-hinweis').classList.add('ausgeblendet'); }, {passive:true});
container.addEventListener('touchmove', (e) => {
  if (!fingerStart || istFlipping) return;
  fingerAktuell = e.touches[0].clientX;
  const diff = fingerAktuell - fingerStart;
  if (Math.abs(diff) > 10 && diff < 0 && aktuelleSeite < SEITEN.length-1) {
    const seiteEl = document.getElementById('seite-aktuell');
    const winkel = Math.max(-35, Math.min(0, diff / 6));
    seiteEl.style.transition = 'none'; seiteEl.style.transform = 'rotateY(' + winkel + 'deg)';
    seiteEl.style.boxShadow = (-winkel*2) + 'px 0 ' + (-winkel*3) + 'px rgba(0,0,0,0.4)';
  }
}, {passive:true});
container.addEventListener('touchend', (e) => {
  if (!fingerStart) return;
  const diff = fingerAktuell - fingerStart;
  const seiteEl = document.getElementById('seite-aktuell');
  seiteEl.style.transition = 'transform 0.3s,box-shadow 0.3s'; seiteEl.style.transform = 'rotateY(0deg)'; seiteEl.style.boxShadow = '';
  if (Math.abs(diff) > 60) {
    if (diff < 0 && aktuelleSeite < SEITEN.length-1) setTimeout(() => animiere('vor'), 250);
    else if (diff > 0 && aktuelleSeite > 0) setTimeout(() => animiere('zuruck'), 250);
  }
  fingerStart = null; fingerAktuell = null;
}, {passive:true});

function geheZurueck() { try { window.ReactNativeWebView.postMessage(JSON.stringify({typ:'magi'})); } catch(e) {} }
function geheZurueckFavoriten() { try { window.ReactNativeWebView.postMessage(JSON.stringify({typ:'favoriten'})); } catch(e) {} }

zeigeSeite(aktuelleSeite);
setTimeout(() => document.getElementById('wisch-hinweis').classList.add('ausgeblendet'), 3000);
</script>
</body>
</html>`;

    return (
      <View style={{ flex: 1, backgroundColor: "#0D0625" }}>
        <View style={[styles.leseHeader, { backgroundColor: "#2D0A5A" }]}>
          <TouchableOpacity
            style={styles.zurueckBtn}
            onPress={() => {
              stoppeAudio();
              setAusgewaehlt(null);
              ladeDaten();
            }}
          >
            <Text style={styles.zurueckText}>🪄 Magi</Text>
          </TouchableOpacity>
          <Text style={styles.leseTitel} numberOfLines={1}>
            {ausgewaehlt.titel}
          </Text>
          <TouchableOpacity
            style={[
              styles.audioBtn,
              { backgroundColor: sprichtGerade ? "#E74C3C" : "#7B3FA0" },
            ]}
            onPress={sprichtGerade ? stoppeAudio : starteAudio}
          >
            <Text style={{ fontSize: 18 }}>{sprichtGerade ? "⏹️" : "🔊"}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1 }}>
          {WebViewComponent ? (
            <WebViewComponent
              source={{ html }}
              style={{ flex: 1, backgroundColor: "#0D0625" }}
              scrollEnabled={false}
              onMessage={(event: any) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.typ === "seite") setAktuelleSeite(data.wert);
                  else if (data.typ === "magi") {
                    stoppeAudio();
                    loescheLesefortschritt();
                    setAusgewaehlt(null);
                    router.push("/");
                  } else if (data.typ === "favoriten") {
                    stoppeAudio();
                    setAusgewaehlt(null);
                    ladeDaten();
                  }
                } catch {}
              }}
            />
          ) : (
            <ScrollView style={{ backgroundColor: "#0D0625" }}>
              <View style={{ padding: 20 }}>
                <Text
                  style={{ color: "#E8D5FF", fontSize: 16, lineHeight: 28 }}
                >
                  {seiten[aktuelleSeite]}
                </Text>
              </View>
              <View style={styles.navLeiste}>
                <TouchableOpacity
                  style={[
                    styles.navBtn,
                    { backgroundColor: istErsteSeite ? "#333" : "#7B3FA0" },
                  ]}
                  onPress={() => blatterUm("zuruck")}
                  disabled={istErsteSeite}
                >
                  <Text style={{ color: "white", fontWeight: "800" }}>
                    ◀ Zurück
                  </Text>
                </TouchableOpacity>
                <Text style={{ color: "#FFD700" }}>
                  {aktuelleSeite + 1}/{seiten.length}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.navBtn,
                    { backgroundColor: istLetzteSeite ? "#333" : "#7B3FA0" },
                  ]}
                  onPress={() => blatterUm("vor")}
                  disabled={istLetzteSeite}
                >
                  <Text style={{ color: "white", fontWeight: "800" }}>
                    Weiter ▶
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    );
  }

  // ═══ LISTE SCREEN ═══
  return (
    <View style={{ flex: 1, backgroundColor: "#0D0625" }}>
      <View style={styles.himmel}>
        <SchwebenderStern x={20} y={20} groesse={14} verzoegerung={0} />
        <SchwebenderStern
          x={width * 0.6}
          y={30}
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
            styles.logoContainer,
            { transform: [{ translateY: logoAnim }] },
          ]}
        >
          <Text style={styles.logoText}>⭐ Favoriten</Text>
          <Text style={styles.logoUnter}>
            {Object.values(gruppiertNachGenre).reduce(
              (s, arr) => s + arr.length,
              0,
            )}{" "}
            Lieblingsgeschichte(n)
          </Text>
        </Animated.View>
        <View style={styles.dekoZeile}>
          <Text style={{ fontSize: 22 }}>🏰</Text>
          <Text style={{ fontSize: 18 }}>🌲</Text>
          <Text style={{ fontSize: 26 }}>🌟</Text>
          <Text style={{ fontSize: 18 }}>🌲</Text>
          <Text style={{ fontSize: 22 }}>🏰</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hauptBereich}>
          {fortschritt && (
            <TouchableOpacity
              style={styles.weiterlesenBtn}
              onPress={async () => {
                const alle = await ladeAlleGeschichten();
                const g = alle.find((x) => x.id === fortschritt.geschichteId);
                if (g) oeffneGeschichte(g, fortschritt.aktuelleSeite);
              }}
            >
              <View style={styles.weiterlesenLinks}>
                <Text style={{ fontSize: 30 }}>📚</Text>
                <View>
                  <Text style={styles.weiterlesenTitel}>Weiterlesen</Text>
                  <Text style={styles.weiterlesenUnter} numberOfLines={1}>
                    {fortschritt.titel}
                  </Text>
                  <Text style={styles.weiterlesenSeite}>
                    Seite {fortschritt.aktuelleSeite + 1} /{" "}
                    {fortschritt.gesamtSeiten}
                  </Text>
                </View>
              </View>
              <View>
                <View style={styles.weiterlesenBalken}>
                  <View
                    style={[
                      styles.weiterlesenFull,
                      {
                        width:
                          `${((fortschritt.aktuelleSeite + 1) / fortschritt.gesamtSeiten) * 100}%` as any,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.weiterlesenPfeil}>▶</Text>
              </View>
            </TouchableOpacity>
          )}

          {Object.values(gruppiertNachGenre).reduce(
            (s, arr) => s + arr.length,
            0,
          ) === 0 ? (
            <View style={styles.leerBox}>
              <Text style={{ fontSize: 50, textAlign: "center" }}>📚</Text>
              <Text style={styles.leerTitel}>Noch keine Favoriten!</Text>
              <Text style={styles.leerText}>
                Lies eine Geschichte und drücke 👍 am Ende!
              </Text>
            </View>
          ) : (
            <Animated.View style={{ opacity: fadeIn }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterLeiste}
              >
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    !aktiveGenre && styles.filterChipAktiv,
                  ]}
                  onPress={() => setAktiveGenre(null)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      !aktiveGenre && { color: "white" },
                    ]}
                  >
                    ✨ Alle
                  </Text>
                </TouchableOpacity>
                {alleGenres.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.filterChip,
                      aktiveGenre === g && {
                        backgroundColor: GENRE_FARBE[g],
                        borderColor: GENRE_FARBE[g],
                      },
                    ]}
                    onPress={() => setAktiveGenre(aktiveGenre === g ? null : g)}
                  >
                    <Text style={{ fontSize: 15 }}>{GENRE_EMOJI[g]}</Text>
                    <Text
                      style={[
                        styles.filterText,
                        aktiveGenre === g && { color: "white" },
                      ]}
                    >
                      {g}
                    </Text>
                    <View
                      style={[
                        styles.filterBadge,
                        {
                          backgroundColor:
                            aktiveGenre === g
                              ? "rgba(255,255,255,0.3)"
                              : GENRE_FARBE[g],
                        },
                      ]}
                    >
                      <Text style={styles.filterBadgeText}>
                        {gruppiertNachGenre[g].length}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {(aktiveGenre ? [aktiveGenre] : alleGenres).map((genre) => (
                <View key={genre} style={styles.genreBlock}>
                  <View
                    style={[
                      styles.genreHeader,
                      { backgroundColor: GENRE_FARBE[genre] || "#888" },
                    ]}
                  >
                    <Text style={{ fontSize: 22 }}>{GENRE_EMOJI[genre]}</Text>
                    <Text style={styles.genreHeaderTitel}>{genre}</Text>
                    <View style={styles.genreHeaderBadge}>
                      <Text style={styles.genreHeaderBadgeText}>
                        {gruppiertNachGenre[genre].length}
                      </Text>
                    </View>
                  </View>
                  {gruppiertNachGenre[genre].map((g) => {
                    const seitenAnzahl = teileInSeiten(g.text, 80).length;
                    const farbe = GENRE_FARBE[g.genre] || "#9B59B6";
                    return (
                      <TouchableOpacity
                        key={g.id}
                        style={styles.karte}
                        onPress={() => oeffneGeschichte(g)}
                      >
                        <View
                          style={[
                            styles.karteAkzent,
                            { backgroundColor: farbe },
                          ]}
                        />
                        <View style={styles.karteInhalt}>
                          <Text style={styles.karteTitel} numberOfLines={2}>
                            {g.titel}
                          </Text>
                          <View style={styles.karteMeta}>
                            <Text style={styles.karteMetaText}>
                              👤 {g.akteure || "Kaninchen"}
                            </Text>
                            <Text style={styles.karteMetaText}>
                              📅 {g.datum}
                            </Text>
                            <Text
                              style={[
                                styles.karteMetaText,
                                { color: farbe, fontWeight: "800" },
                              ]}
                            >
                              📄 {seitenAnzahl} Seiten
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.karteArrow}>▶</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </Animated.View>
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
    minHeight: height * 0.28,
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
  },
  magiBtnText: { color: "white", fontSize: 13, fontWeight: "700" },
  logoContainer: { alignItems: "center", marginBottom: 8, marginTop: 8 },
  logoText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFD700",
    textShadowColor: "rgba(255,180,0,0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  logoUnter: {
    fontSize: 12,
    color: "rgba(200,180,255,0.9)",
    fontWeight: "600",
    marginTop: 3,
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
  weiterlesenBtn: {
    backgroundColor: "#2D0A5A",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#7B3FA0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weiterlesenLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  weiterlesenTitel: { fontSize: 13, fontWeight: "900", color: "#FFD700" },
  weiterlesenUnter: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    maxWidth: width * 0.45,
  },
  weiterlesenSeite: { fontSize: 10, color: "#9B8FC0", marginTop: 1 },
  weiterlesenBalken: {
    width: 50,
    height: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  weiterlesenFull: {
    height: "100%",
    backgroundColor: "#FFD700",
    borderRadius: 3,
  },
  weiterlesenPfeil: {
    fontSize: 16,
    color: "#FFD700",
    fontWeight: "900",
    textAlign: "right",
  },
  leerBox: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#2D0A5A",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#5A3A8A",
    margin: 4,
  },
  leerTitel: {
    fontSize: 16,
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
  filterLeiste: { paddingVertical: 10, gap: 8 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1.5,
    borderColor: "#5A3A8A",
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#2D0A5A",
  },
  filterChipAktiv: { backgroundColor: "#7B3FA0", borderColor: "#9B59B6" },
  filterText: { fontSize: 12, fontWeight: "700", color: "#C0A0FF" },
  filterBadge: { borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  filterBadgeText: { fontSize: 10, fontWeight: "900", color: "white" },
  genreBlock: { marginBottom: 14 },
  genreHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingHorizontal: 14,
    gap: 8,
    borderRadius: 14,
    marginBottom: 6,
  },
  genreHeaderTitel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
    color: "white",
  },
  genreHeaderBadge: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  genreHeaderBadgeText: { fontSize: 13, fontWeight: "900", color: "white" },
  karte: {
    backgroundColor: "#2D0A5A",
    borderRadius: 16,
    marginBottom: 7,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#5A3A8A",
  },
  karteAkzent: { width: 5, alignSelf: "stretch" },
  karteInhalt: { flex: 1, padding: 12 },
  karteTitel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#E8D5FF",
    marginBottom: 5,
  },
  karteMeta: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  karteMetaText: { fontSize: 10, color: "#9B8FC0", fontWeight: "600" },
  karteArrow: { fontSize: 15, color: "#7B3FA0", paddingRight: 12 },
  leseHeader: {
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leseTitel: {
    fontSize: 15,
    fontWeight: "800",
    color: "white",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  zurueckBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  zurueckText: { color: "white", fontSize: 13, fontWeight: "700" },
  audioBtn: { borderRadius: 18, padding: 9, elevation: 4 },
  navLeiste: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  navBtn: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10 },
});
