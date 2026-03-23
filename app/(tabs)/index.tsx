import {
  erstellePersonalisiertesPrompt,
  ladeLesefortschritt,
  Lesefortschritt,
  loescheLesefortschritt,
  speichereGeschichte,
  speichereLesefortschritt,
} from "@/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");
const isTablet = width >= 768;

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

// ==================== AUDIO-EINSTELLUNGEN PRO GENRE ====================
const AUDIO_EINSTELLUNGEN: Record<
  string,
  { rate: number; pitch: number; description: string }
> = {
  Abenteuer: {
    rate: 0.85,
    pitch: 1.15,
    description: "Schnell & Abenteuerlich",
  },
  Märchen: { rate: 0.75, pitch: 1.25, description: "Langsam & Märchenhaft" },
  Tiere: { rate: 0.8, pitch: 1.2, description: "Verspielt & Tierisch" },
  Weltraum: { rate: 0.7, pitch: 1.1, description: "Geheimnisvoll & Weltraum" },
  Detektiv: { rate: 0.82, pitch: 1.12, description: "Spannend & Detektivisch" },
  default: { rate: 0.78, pitch: 1.18, description: "Ausgewogen" },
};

// ==================== SPRACHEN FÜR VORLESEN ====================
const SPRACH_OPTIONEN = [
  {
    code: "de",
    name: "Deutsch",
    flag: "🇩🇪",
    voiceLang: "de-DE",
    preferredVoice: "Anna",
  },
  {
    code: "en",
    name: "English",
    flag: "🇬🇧",
    voiceLang: "en-US",
    preferredVoice: "Samantha",
  },
  {
    code: "fr",
    name: "Français",
    flag: "🇫🇷",
    voiceLang: "fr-FR",
    preferredVoice: "Amélie",
  },
  {
    code: "es",
    name: "Español",
    flag: "🇪🇸",
    voiceLang: "es-ES",
    preferredVoice: "Mónica",
  },
  {
    code: "it",
    name: "Italiano",
    flag: "🇮🇹",
    voiceLang: "it-IT",
    preferredVoice: "Alice",
  },
  {
    code: "tr",
    name: "Türkçe",
    flag: "🇹🇷",
    voiceLang: "tr-TR",
    preferredVoice: "Yelda",
  },
];

// ==================== UI-TEXTE FÜR APP-SPRACHE ====================
const UI_TEXTE: Record<string, any> = {
  de: {
    appName: "Magi",
    appSubtitle: "Geschichten-Zauber",
    startStory: "Geschichte starten",
    startSub: "Wähle dein Abenteuer!",
    continueReading: "Weiterlesen",
    page: "Seite",
    of: "von",
    randomMagic: "Zauber-Zufall",
    randomSub: "Überraschung!",
    favorites: "Favoriten",
    favoritesSub: "Nach Genre",
    treasure: "Schatzkammer",
    treasureSub: "Quiz & Kristalle",
    parents: "Eltern",
    parentsSub: "Dashboard & PIN",
    settings: "Einstellungen",
    newStory: "Neue Geschichte",
    howOld: "🎂 Wie alt bist du?",
    whoPlays: "🦸 Wer soll mitspielen?",
    figureHint: '💡 Mehrere Figuren mit "und" trennen',
    howLong: "⏱️ Wie lange?",
    chooseGenre: "📚 Genre wählen",
    startMagic: "✨ Geschichte starten!",
    backHome: "Home",
    loading: "Zauberstaub fliegt...",
    loadingSub: "Deine Geschichte entsteht! 🌈",
    end: "Ende",
    likeQuestion: "✨ Hat dir die Geschichte gefallen? ✨",
    great: "Toll!",
    notGood: "Nicht so gut",
    saved: "🌟 Super! Die Geschichte wurde gespeichert!",
    thanks: "😊 Danke für dein Feedback!",
    swipeHint: "👆 Zum Umblättern nach links oder rechts wischen",
    settingsTitle: "Einstellungen",
    appLanguage: "App-Sprache",
    appLanguageDesc: "In welcher Sprache soll die App angezeigt werden?",
    readingLanguage: "Vorlese-Sprache",
    readingLanguageDesc: "In welcher Sprache soll vorgelesen werden?",
    audioSettings: "Audio-Einstellungen",
    audioSpeed: "Erzählgeschwindigkeit",
    audioPitch: "Stimmlage",
    useGenreAudio: "Genre-optimierte Stimme verwenden",
    testAudio: "Test-Vorlesen",
    saveSettings: "Einstellungen speichern",
    close: "Schließen",
    genres: {
      Abenteuer: "Abenteuer",
      Märchen: "Märchen",
      Tiere: "Tiere",
      Weltraum: "Weltraum",
      Detektiv: "Detektiv",
    },
    durations: {
      "2": "2 Min ⚡",
      "5": "5 Min 📖",
      "10": "10 Min 🌟",
      "15": "15 Min 🏆",
    },
  },
  en: {
    appName: "Magi",
    appSubtitle: "Story Magic",
    startStory: "Start Story",
    startSub: "Choose your adventure!",
    continueReading: "Continue Reading",
    page: "Page",
    of: "of",
    randomMagic: "Magic Random",
    randomSub: "Surprise!",
    favorites: "Favorites",
    favoritesSub: "By Genre",
    treasure: "Treasure",
    treasureSub: "Quiz & Crystals",
    parents: "Parents",
    parentsSub: "Dashboard & PIN",
    settings: "Settings",
    newStory: "New Story",
    howOld: "🎂 How old are you?",
    whoPlays: "🦸 Who should play?",
    figureHint: "💡 Separate multiple characters with 'and'",
    howLong: "⏱️ How long?",
    chooseGenre: "📚 Choose genre",
    startMagic: "✨ Start Story!",
    backHome: "Home",
    loading: "Magic dust is flying...",
    loadingSub: "Your story is being created! 🌈",
    end: "End",
    likeQuestion: "✨ Did you like the story? ✨",
    great: "Great!",
    notGood: "Not so good",
    saved: "🌟 Great! The story has been saved!",
    thanks: "😊 Thanks for your feedback!",
    swipeHint: "👆 Swipe left or right to turn pages",
    settingsTitle: "Settings",
    appLanguage: "App Language",
    appLanguageDesc: "In which language should the app be displayed?",
    readingLanguage: "Reading Language",
    readingLanguageDesc: "In which language should be read aloud?",
    audioSettings: "Audio Settings",
    audioSpeed: "Reading Speed",
    audioPitch: "Voice Pitch",
    useGenreAudio: "Use genre-optimized voice",
    testAudio: "Test Reading",
    saveSettings: "Save Settings",
    close: "Close",
    genres: {
      Abenteuer: "Adventure",
      Märchen: "Fairy Tale",
      Tiere: "Animals",
      Weltraum: "Space",
      Detektiv: "Detective",
    },
    durations: {
      "2": "2 Min ⚡",
      "5": "5 Min 📖",
      "10": "10 Min 🌟",
      "15": "15 Min 🏆",
    },
  },
  fr: {
    appName: "Magi",
    appSubtitle: "Magie des histoires",
    startStory: "Commencer",
    startSub: "Choisis ton aventure!",
    continueReading: "Continuer",
    page: "Page",
    of: "de",
    randomMagic: "Hasard magique",
    randomSub: "Surprise!",
    favorites: "Favoris",
    favoritesSub: "Par genre",
    treasure: "Trésor",
    treasureSub: "Quiz & Cristaux",
    parents: "Parents",
    parentsSub: "Tableau & PIN",
    settings: "Paramètres",
    newStory: "Nouvelle histoire",
    howOld: "🎂 Quel âge as-tu?",
    whoPlays: "🦸 Qui doit jouer?",
    figureHint: "💡 Sépare plusieurs personnages par 'et'",
    howLong: "⏱️ Combien de temps?",
    chooseGenre: "📚 Choisis le genre",
    startMagic: "✨ Commencer!",
    backHome: "Accueil",
    loading: "La poussière magique vole...",
    loadingSub: "Ton histoire est en train de naître! 🌈",
    end: "Fin",
    likeQuestion: "✨ As-tu aimé l'histoire? ✨",
    great: "Super!",
    notGood: "Pas terrible",
    saved: "🌟 Super! L'histoire a été sauvegardée!",
    thanks: "😊 Merci pour ton avis!",
    swipeHint: "👆 Glisse à gauche ou à droite pour tourner les pages",
    settingsTitle: "Paramètres",
    appLanguage: "Langue de l'app",
    appLanguageDesc: "Dans quelle langue afficher l'application?",
    readingLanguage: "Langue de lecture",
    readingLanguageDesc: "Dans quelle langue lire à voix haute?",
    audioSettings: "Paramètres audio",
    audioSpeed: "Vitesse de lecture",
    audioPitch: "Hauteur de voix",
    useGenreAudio: "Utiliser la voix optimisée par genre",
    testAudio: "Test de lecture",
    saveSettings: "Enregistrer",
    close: "Fermer",
    genres: {
      Abenteuer: "Aventure",
      Märchen: "Conte",
      Tiere: "Animaux",
      Weltraum: "Espace",
      Detektiv: "Détective",
    },
    durations: {
      "2": "2 Min ⚡",
      "5": "5 Min 📖",
      "10": "10 Min 🌟",
      "15": "15 Min 🏆",
    },
  },
  es: {
    appName: "Magi",
    appSubtitle: "Magia de cuentos",
    startStory: "Comenzar",
    startSub: "¡Elige tu aventura!",
    continueReading: "Continuar",
    page: "Página",
    of: "de",
    randomMagic: "Azar mágico",
    randomSub: "¡Sorpresa!",
    favorites: "Favoritos",
    favoritesSub: "Por género",
    treasure: "Tesoro",
    treasureSub: "Quiz & Cristales",
    parents: "Padres",
    parentsSub: "Panel & PIN",
    settings: "Ajustes",
    newStory: "Nueva historia",
    howOld: "🎂 ¿Cuántos años tienes?",
    whoPlays: "🦸 ¿Quién debe jugar?",
    figureHint: "💡 Separa varios personajes con 'y'",
    howLong: "⏱️ ¿Cuánto tiempo?",
    chooseGenre: "📚 Elige género",
    startMagic: "✨ ¡Comenzar!",
    backHome: "Inicio",
    loading: "El polvo mágico vuela...",
    loadingSub: "¡Tu historia está siendo creada! 🌈",
    end: "Fin",
    likeQuestion: "✨ ¿Te gustó la historia? ✨",
    great: "¡Genial!",
    notGood: "No tan bien",
    saved: "🌟 ¡Genial! ¡La historia ha sido guardada!",
    thanks: "😊 ¡Gracias por tu opinión!",
    swipeHint: "👆 Desliza izquierda o derecha para pasar páginas",
    settingsTitle: "Ajustes",
    appLanguage: "Idioma de la app",
    appLanguageDesc: "¿En qué idioma mostrar la aplicación?",
    readingLanguage: "Idioma de lectura",
    readingLanguageDesc: "¿En qué idioma leer en voz alta?",
    audioSettings: "Ajustes de audio",
    audioSpeed: "Velocidad de lectura",
    audioPitch: "Tono de voz",
    useGenreAudio: "Usar voz optimizada por género",
    testAudio: "Prueba de lectura",
    saveSettings: "Guardar",
    close: "Cerrar",
    genres: {
      Abenteuer: "Aventura",
      Märchen: "Cuento",
      Tiere: "Animales",
      Weltraum: "Espacio",
      Detektiv: "Detective",
    },
    durations: {
      "2": "2 Min ⚡",
      "5": "5 Min 📖",
      "10": "10 Min 🌟",
      "15": "15 Min 🏆",
    },
  },
  it: {
    appName: "Magi",
    appSubtitle: "Magia delle storie",
    startStory: "Inizia",
    startSub: "Scegli la tua avventura!",
    continueReading: "Continua",
    page: "Pagina",
    of: "di",
    randomMagic: "Casuale magico",
    randomSub: "Sorpresa!",
    favorites: "Preferiti",
    favoritesSub: "Per genere",
    treasure: "Tesoro",
    treasureSub: "Quiz & Cristalli",
    parents: "Genitori",
    parentsSub: "Dashboard & PIN",
    settings: "Impostazioni",
    newStory: "Nuova storia",
    howOld: "🎂 Quanti anni hai?",
    whoPlays: "🦸 Chi deve giocare?",
    figureHint: "💡 Separa più personaggi con 'e'",
    howLong: "⏱️ Quanto tempo?",
    chooseGenre: "📚 Scegli genere",
    startMagic: "✨ Inizia!",
    backHome: "Home",
    loading: "Polvere magica vola...",
    loadingSub: "La tua storia sta nascendo! 🌈",
    end: "Fine",
    likeQuestion: "✨ Ti è piaciuta la storia? ✨",
    great: "Grande!",
    notGood: "Non tanto",
    saved: "🌟 Grande! La storia è stata salvata!",
    thanks: "😊 Grazie per il feedback!",
    swipeHint: "👆 Scorri a sinistra o destra per girare le pagine",
    settingsTitle: "Impostazioni",
    appLanguage: "Lingua dell'app",
    appLanguageDesc: "In quale lingua mostrare l'app?",
    readingLanguage: "Lingua di lettura",
    readingLanguageDesc: "In quale lingua leggere ad alta voce?",
    audioSettings: "Impostazioni audio",
    audioSpeed: "Velocità di lettura",
    audioPitch: "Altezza voce",
    useGenreAudio: "Usa voce ottimizzata per genere",
    testAudio: "Test di lettura",
    saveSettings: "Salva",
    close: "Chiudi",
    genres: {
      Abenteuer: "Avventura",
      Märchen: "Fiaba",
      Tiere: "Animali",
      Weltraum: "Spazio",
      Detektiv: "Detective",
    },
    durations: {
      "2": "2 Min ⚡",
      "5": "5 Min 📖",
      "10": "10 Min 🌟",
      "15": "15 Min 🏆",
    },
  },
  tr: {
    appName: "Magi",
    appSubtitle: "Hikaye Büyüsü",
    startStory: "Hikaye Başlat",
    startSub: "Macera seç!",
    continueReading: "Okumaya Devam Et",
    page: "Sayfa",
    of: "/",
    randomMagic: "Sihirli Rastgele",
    randomSub: "Sürpriz!",
    favorites: "Favoriler",
    favoritesSub: "Türe Göre",
    treasure: "Hazine",
    treasureSub: "Quiz & Kristaller",
    parents: "Ebeveynler",
    parentsSub: "Panel & PIN",
    settings: "Ayarlar",
    newStory: "Yeni Hikaye",
    howOld: "🎂 Kaç yaşındasın?",
    whoPlays: "🦸 Kimler oynasın?",
    figureHint: "💡 Birden fazla karakteri 've' ile ayır",
    howLong: "⏱️ Ne kadar sürecek?",
    chooseGenre: "📚 Tür seç",
    startMagic: "✨ Hikaye Başlat!",
    backHome: "Ana Sayfa",
    loading: "Sihirli toz uçuşuyor...",
    loadingSub: "Hikayen oluşturuluyor! 🌈",
    end: "Son",
    likeQuestion: "✨ Hikaye hoşuna gitti mi? ✨",
    great: "Harika!",
    notGood: "Pek iyi değil",
    saved: "🌟 Harika! Hikaye kaydedildi!",
    thanks: "😊 Geri bildirimin için teşekkürler!",
    swipeHint: "👆 Sayfaları çevirmek için sola veya sağa kaydır",
    settingsTitle: "Ayarlar",
    appLanguage: "Uygulama Dili",
    appLanguageDesc: "Uygulama hangi dilde görünsün?",
    readingLanguage: "Okuma Dili",
    readingLanguageDesc: "Hangi dilde sesli okunsun?",
    audioSettings: "Ses Ayarları",
    audioSpeed: "Okuma Hızı",
    audioPitch: "Ses Tonu",
    useGenreAudio: "Türe göre optimize edilmiş ses kullan",
    testAudio: "Test Okuması",
    saveSettings: "Kaydet",
    close: "Kapat",
    genres: {
      Abenteuer: "Macera",
      Märchen: "Masal",
      Tiere: "Hayvanlar",
      Weltraum: "Uzay",
      Detektiv: "Dedektif",
    },
    durations: {
      "2": "2 Dk ⚡",
      "5": "5 Dk 📖",
      "10": "10 Dk 🌟",
      "15": "15 Dk 🏆",
    },
  },
};

function bildUrl(akteure: string, genre: string, seite: number): string {
  const szenen = [
    `${akteure} waving hello greeting smiling`,
    `${akteure} exploring adventure scene`,
    `${akteure} exciting challenge moment`,
    `${akteure} happy victory celebration`,
  ];
  const prompt = `3D cartoon pixar style, cute chubby character, ${szenen[Math.min(seite, szenen.length - 1)]}, ${genre} children book, soft dreamy background, vibrant saturated colors, big shiny eyes, round shapes, glossy, professional kids illustration`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=600&height=400&nologo=true&seed=${seite * 42 + 7}`;
}

function teileInSeiten(text: string, worterProSeite = 80): string[] {
  const woerter = text.split(" ");
  const seiten: string[] = [];
  for (let i = 0; i < woerter.length; i += worterProSeite) {
    seiten.push(woerter.slice(i, i + worterProSeite).join(" "));
  }
  return seiten.length > 0 ? seiten : [text];
}

// Text für bessere Sprachausgabe vorbereiten
function bereiteTextFuerAudioVor(text: string): string {
  let vorbereiteterText = text;
  vorbereiteterText = vorbereiteterText.replace(/\*\*(.*?)\*\*/g, "$1");
  vorbereiteterText = vorbereiteterText.replace(/\*(.*?)\*/g, "$1");
  vorbereiteterText = vorbereiteterText.replace(/\. /g, ". ... ");
  vorbereiteterText = vorbereiteterText.replace(/\! /g, "! ... ");
  vorbereiteterText = vorbereiteterText.replace(/\? /g, "? ... ");
  vorbereiteterText = vorbereiteterText.replace(/\s+/g, " ").trim();
  return vorbereiteterText;
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

function GlitzerPartikel({
  x,
  y,
  verzoegerung,
}: {
  x: number;
  y: number;
  verzoegerung: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(anim, {
            toValue: -20,
            duration: 1500 + verzoegerung,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 1500 + verzoegerung,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(fade, {
            toValue: 0.1,
            duration: 800 + verzoegerung,
            useNativeDriver: true,
          }),
          Animated.timing(fade, {
            toValue: 1,
            duration: 800 + verzoegerung,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, []);
  return (
    <Animated.Text
      style={[
        { position: "absolute", left: x, top: y, fontSize: 14 },
        { transform: [{ translateY: anim }], opacity: fade },
      ]}
    >
      ✨
    </Animated.Text>
  );
}

function LadeAnimation({ genre, t }: { genre: string; t: any }) {
  const bounce = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: -30,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ).start();
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  const rotation = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  return (
    <View style={styles.ladeContainer}>
      <View style={styles.ladeBox}>
        <Animated.Text
          style={[{ fontSize: 90 }, { transform: [{ translateY: bounce }] }]}
        >
          {GENRE_EMOJI[genre]}
        </Animated.Text>
        <Animated.Text
          style={[
            { fontSize: 40, marginTop: 8 },
            { transform: [{ rotate: rotation }, { scale: pulse }] },
          ]}
        >
          ✨
        </Animated.Text>
        <Text style={styles.ladeTitel}>{t.loading}</Text>
        <Text style={styles.ladeUnter}>{t.loadingSub}</Text>
      </View>
    </View>
  );
}

type Ansicht = "home" | "formular" | "lesen";

export default function HomeScreen(): React.JSX.Element {
  const router = useRouter();
  const [ansicht, setAnsicht] = useState<Ansicht>("home");
  const [alter, setAlter] = useState("5");
  const [akteure, setAkteure] = useState("");
  const [genre, setGenre] = useState("Märchen");
  const [dauer, setDauer] = useState("5");
  const [geschichte, setGeschichte] = useState("");
  const [laedt, setLaedt] = useState(false);
  const [seiten, setSeiten] = useState<string[]>([]);
  const [aktuelleSeite, setAktuelleSeite] = useState(0);
  const [sprichtGerade, setSprichtGerade] = useState(false);
  const [aktuelleAkteure, setAktuelleAkteure] = useState("");
  const [bildUrls, setBildUrls] = useState<string[]>([]);
  const [bewertung, setBewertung] = useState<"gut" | "schlecht" | null>(null);
  const [geschichteId] = useState(() => Date.now().toString());
  const [fortschritt, setFortschritt] = useState<Lesefortschritt | null>(null);

  // Einstellungen
  const [einstellungenModal, setEinstellungenModal] = useState(false);
  const [appSprache, setAppSprache] = useState("de");
  const [vorleseSprache, setVorleseSprache] = useState("de");
  const [audioRate, setAudioRate] = useState(0.78);
  const [audioPitch, setAudioPitch] = useState(1.18);
  const [verwendeGenreAudio, setVerwendeGenreAudio] = useState(true);

  const logoSchwebAnim = useRef(new Animated.Value(0)).current;
  const zauberAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const daumenHoch = useRef(new Animated.Value(1)).current;
  const daumenRunter = useRef(new Animated.Value(1)).current;
  const genres = ["Abenteuer", "Märchen", "Tiere", "Weltraum", "Detektiv"];
  const kachelBreite = (width - 48) / 2;
  const himmelHoehe = height * 0.38;
  const kachelHoehe = Math.max(100, (height - himmelHoehe - 280) / 2);

  const t = UI_TEXTE[appSprache] || UI_TEXTE.de;
  const getGenreName = (genreKey: string) => t.genres?.[genreKey] || genreKey;
  const getDauerLabel = (dauerWert: string) =>
    t.durations?.[dauerWert] ||
    DAUER_OPTIONEN.find((d) => d.wert === dauerWert)?.label ||
    dauerWert;

  useEffect(() => {
    ladeEinstellungen();
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoSchwebAnim, {
          toValue: -14,
          duration: 2200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(logoSchwebAnim, {
          toValue: 0,
          duration: 2200,
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
    ladeFortschritt();
  }, []);

  const ladeEinstellungen = async () => {
    try {
      const gespeicherteAppSprache = await AsyncStorage.getItem("appSprache");
      const gespeicherteVorleseSprache =
        await AsyncStorage.getItem("vorleseSprache");
      const gespeicherteAudioRate = await AsyncStorage.getItem("audioRate");
      const gespeicherteAudioPitch = await AsyncStorage.getItem("audioPitch");
      const gespeicherteVerwendeGenreAudio =
        await AsyncStorage.getItem("verwendeGenreAudio");

      if (gespeicherteAppSprache) setAppSprache(gespeicherteAppSprache);
      if (gespeicherteVorleseSprache)
        setVorleseSprache(gespeicherteVorleseSprache);
      if (gespeicherteAudioRate)
        setAudioRate(parseFloat(gespeicherteAudioRate));
      if (gespeicherteAudioPitch)
        setAudioPitch(parseFloat(gespeicherteAudioPitch));
      if (gespeicherteVerwendeGenreAudio)
        setVerwendeGenreAudio(gespeicherteVerwendeGenreAudio === "true");
    } catch (error) {
      console.error("Fehler beim Laden:", error);
    }
  };

  const speichereEinstellungen = async () => {
    try {
      await AsyncStorage.setItem("appSprache", appSprache);
      await AsyncStorage.setItem("vorleseSprache", vorleseSprache);
      await AsyncStorage.setItem("audioRate", String(audioRate));
      await AsyncStorage.setItem("audioPitch", String(audioPitch));
      await AsyncStorage.setItem(
        "verwendeGenreAudio",
        String(verwendeGenreAudio),
      );
      setEinstellungenModal(false);
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
    }
  };

  const ladeFortschritt = async () => {
    const f = await ladeLesefortschritt();
    setFortschritt(f);
  };

  useEffect(() => {
    if (ansicht === "home") ladeFortschritt();
  }, [ansicht]);

  useEffect(() => {
    if (geschichte) {
      const seitenArray = teileInSeiten(geschichte, 80);
      setSeiten(seitenArray);
      setAktuelleSeite(0);
      setBewertung(null);
      const urls = seitenArray.map((_, i) =>
        bildUrl(aktuelleAkteure || "cute wizard", genre, i),
      );
      setBildUrls(urls);
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
      setAnsicht("lesen");
    } else {
      fadeIn.setValue(0);
    }
  }, [geschichte]);

  useEffect(() => {
    if (ansicht === "lesen" && geschichte && seiten.length > 0) {
      const titelText =
        geschichte.match(/\*\*(.*?)\*\*/)?.[1] || "Unsere Geschichte";
      speichereLesefortschritt({
        geschichteId,
        titel: titelText,
        genre,
        aktuelleSeite,
        gesamtSeiten: seiten.length,
        datum: new Date().toLocaleDateString("de-DE"),
      });
    }
  }, [aktuelleSeite, ansicht]);

  const bewerte = async (typ: "gut" | "schlecht") => {
    setBewertung(typ);
    const anim = typ === "gut" ? daumenHoch : daumenRunter;
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 1.6,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    const titelText =
      geschichte.match(/\*\*(.*?)\*\*/)?.[1] || "Unsere Geschichte";
    await speichereGeschichte({
      id: geschichteId,
      titel: titelText,
      text: geschichte,
      genre,
      akteure: aktuelleAkteure,
      alter,
      dauer,
      datum: new Date().toLocaleDateString("de-DE"),
      bewertung: typ,
    });
    if (typ === "gut") await loescheLesefortschritt();
  };

  const generiereGeschichteM = async (g?: string, a?: string) => {
    setLaedt(true);
    setGeschichte("");
    const aktG = g || genre;
    const aktA = a || akteure;
    setAktuelleAkteure(aktA);
    stoppeAudio();
    const prompt = await erstellePersonalisiertesPrompt(
      alter,
      aktA,
      aktG,
      dauer,
    );
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
            max_tokens: 3000,
          }),
        },
      );
      const daten = await antwort.json();
      setGeschichte(daten.choices[0].message.content);
    } catch {
      setGeschichte("Ups! Da ist etwas schiefgelaufen.");
    }
    setLaedt(false);
  };

  const zufallsGeschichte = () => {
    const zufallsGenre = genres[Math.floor(Math.random() * genres.length)];
    const zufallsAkteure = [
      "ein Drache",
      "ein Zauberer",
      "eine Prinzessin",
      "ein Dino",
      "ein Fuchs",
    ][Math.floor(Math.random() * 5)];
    setGenre(zufallsGenre);
    setAkteure(zufallsAkteure);
    generiereGeschichteM(zufallsGenre, zufallsAkteure);
  };

  const generiereGeschichte = () => generiereGeschichteM();

  const starteAudio = async () => {
    if (typeof window === "undefined") return;

    if (sprichtGerade) {
      stoppeAudio();
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const synth = (window as any).speechSynthesis;
    if (!synth) return;

    synth.cancel();

    const roherText = seiten[aktuelleSeite] || "";
    const vorbereiteterText = bereiteTextFuerAudioVor(roherText);

    const utterance = new (window as any).SpeechSynthesisUtterance(
      vorbereiteterText,
    );

    const sprachInfo = SPRACH_OPTIONEN.find((s) => s.code === vorleseSprache);
    utterance.lang = sprachInfo?.voiceLang || "de-DE";

    if (verwendeGenreAudio) {
      const genreAudio =
        AUDIO_EINSTELLUNGEN[genre] || AUDIO_EINSTELLUNGEN.default;
      utterance.rate = genreAudio.rate;
      utterance.pitch = genreAudio.pitch;
    } else {
      utterance.rate = audioRate;
      utterance.pitch = audioPitch;
    }

    utterance.volume = 1;

    const stimmen = await new Promise<any[]>((resolve) => {
      if (synth.getVoices().length > 0) {
        resolve(synth.getVoices());
      } else {
        synth.onvoiceschanged = () => resolve(synth.getVoices());
      }
    });

    let besteStimme = null;
    for (const stimme of stimmen) {
      if (stimme.lang.startsWith(utterance.lang)) {
        if (!besteStimme) besteStimme = stimme;
        if (
          sprachInfo?.preferredVoice &&
          stimme.name.includes(sprachInfo.preferredVoice)
        ) {
          besteStimme = stimme;
          break;
        }
      }
    }
    if (besteStimme) utterance.voice = besteStimme;

    utterance.onstart = () => setSprichtGerade(true);

    utterance.onend = () => {
      setSprichtGerade(false);
      if (aktuelleSeite < seiten.length - 1) {
        setTimeout(() => {
          const pfeilRechts = document.getElementById("pfeil-rechts");
          if (pfeilRechts) pfeilRechts.click();
          setTimeout(() => {
            if (aktuelleSeite + 1 < seiten.length) starteAudio();
          }, 500);
        }, 800);
      }
    };

    utterance.onerror = () => setSprichtGerade(false);

    synth.speak(utterance);
  };

  const stoppeAudio = () => {
    if (typeof window === "undefined") return;
    const synth = (window as any).speechSynthesis;
    if (synth) synth.cancel();
    setSprichtGerade(false);
  };

  const testeAudio = () => {
    if (typeof window === "undefined") return;
    const synth = (window as any).speechSynthesis;
    if (!synth) return;

    synth.cancel();

    const testText = verwendeGenreAudio
      ? `✨ Das ist ein Test für die ${getGenreName(genre)}-Stimme. ✨`
      : `✨ Das ist ein Test für deine benutzerdefinierte Stimme. ✨`;

    const utterance = new (window as any).SpeechSynthesisUtterance(testText);
    const sprachInfo = SPRACH_OPTIONEN.find((s) => s.code === vorleseSprache);
    utterance.lang = sprachInfo?.voiceLang || "de-DE";

    if (verwendeGenreAudio) {
      const genreAudio =
        AUDIO_EINSTELLUNGEN[genre] || AUDIO_EINSTELLUNGEN.default;
      utterance.rate = genreAudio.rate;
      utterance.pitch = genreAudio.pitch;
    } else {
      utterance.rate = audioRate;
      utterance.pitch = audioPitch;
    }

    synth.speak(utterance);
    setTimeout(() => synth.cancel(), 3000);
  };

  const titel = geschichte.match(/\*\*(.*?)\*\*/)?.[1] || "Unsere Geschichte";
  const genreFarbe = GENRE_FARBE[genre] || "#9B59B6";
  const zauberRotation = zauberAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (laedt) {
    return (
      <View style={{ flex: 1, backgroundColor: "#1A0A3A" }}>
        <LadeAnimation genre={genre} t={t} />
      </View>
    );
  }

  if (ansicht === "home") {
    const aktuelleSpracheAnzeige = APP_SPRACHEN.find(
      (s) => s.code === appSprache,
    );
    const aktuelleVorleseSpracheAnzeige = SPRACH_OPTIONEN.find(
      (s) => s.code === vorleseSprache,
    );

    return (
      <View style={{ flex: 1, backgroundColor: "#0D0625" }}>
        <View style={[styles.himmel, { height: himmelHoehe }]}>
          <SchwebenderStern x={20} y={20} groesse={14} verzoegerung={0} />
          <SchwebenderStern
            x={width * 0.3}
            y={10}
            groesse={18}
            verzoegerung={300}
          />
          <SchwebenderStern
            x={width * 0.6}
            y={30}
            groesse={12}
            verzoegerung={600}
          />
          <SchwebenderStern
            x={width * 0.85}
            y={15}
            groesse={16}
            verzoegerung={150}
          />
          <GlitzerPartikel x={width * 0.2} y={50} verzoegerung={200} />
          <GlitzerPartikel x={width * 0.5} y={40} verzoegerung={500} />
          <GlitzerPartikel x={width * 0.75} y={60} verzoegerung={100} />
          <View style={styles.lichtstrahl1} />
          <View style={styles.lichtstrahl2} />

          <TouchableOpacity
            style={styles.einstellungenBtn}
            onPress={() => setEinstellungenModal(true)}
          >
            <Text style={styles.einstellungenBtnText}>⚙️</Text>
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.logoContainer,
              { transform: [{ translateY: logoSchwebAnim }] },
            ]}
          >
            <Text
              style={[
                styles.logoText,
                { fontSize: isTablet ? 50 : Math.min(38, height * 0.05) },
              ]}
            >
              🪄 {t.appName}
            </Text>
            <Text style={styles.logoUnter}>{t.appSubtitle}</Text>
            {aktuelleVorleseSpracheAnzeige && (
              <Text style={styles.sprachAnzeige}>
                🔊 {aktuelleVorleseSpracheAnzeige.name}
              </Text>
            )}
          </Animated.View>
          <View style={styles.zauberCharakter}>
            <Animated.Text
              style={[
                styles.zauberStab,
                { transform: [{ rotate: zauberRotation }] },
              ]}
            >
              ✨
            </Animated.Text>
            <Text
              style={[
                styles.zauberFigur,
                { fontSize: Math.min(70, height * 0.1) },
              ]}
            >
              🧙‍♂️
            </Text>
            <View style={styles.zauberGlitzer}>
              <Text style={{ fontSize: 14 }}>✨</Text>
              <Text style={{ fontSize: 10 }}>⭐</Text>
              <Text style={{ fontSize: 16 }}>✨</Text>
            </View>
          </View>
          <View style={styles.dekoZeile}>
            <Text style={{ fontSize: 22 }}>🏰</Text>
            <Text style={{ fontSize: 18 }}>🌲</Text>
            <Text style={{ fontSize: 24 }}>🌟</Text>
            <Text style={{ fontSize: 18 }}>🌲</Text>
            <Text style={{ fontSize: 22 }}>🏰</Text>
          </View>
        </View>

        <View style={styles.hauptBereich}>
          <TouchableOpacity
            style={styles.hauptBtn}
            onPress={() => setAnsicht("formular")}
          >
            <View style={styles.hauptBtnInnen}>
              <Text style={styles.hauptBtnEmoji}>📖</Text>
              <View>
                <Text style={styles.hauptBtnTitel}>{t.startStory}</Text>
                <Text style={styles.hauptBtnUnter}>{t.startSub}</Text>
              </View>
            </View>
            <Text style={styles.hauptBtnPfeil}>▶</Text>
          </TouchableOpacity>

          {fortschritt && (
            <TouchableOpacity
              style={styles.weiterlesenBtn}
              onPress={() => setAnsicht("lesen")}
            >
              <View style={styles.weiterlesenLinks}>
                <Text style={{ fontSize: 28 }}>📚</Text>
                <View>
                  <Text style={styles.weiterlesenTitel}>
                    {t.continueReading}
                  </Text>
                  <Text style={styles.weiterlesenUnter} numberOfLines={1}>
                    {fortschritt.titel}
                  </Text>
                  <Text style={styles.weiterlesenSeite}>
                    {t.page} {fortschritt.aktuelleSeite + 1} {t.of}{" "}
                    {fortschritt.gesamtSeiten}
                  </Text>
                </View>
              </View>
              <View style={styles.weiterlesenFortschritt}>
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

          <View style={styles.kachelGrid}>
            <TouchableOpacity
              style={[
                styles.kachel,
                {
                  width: kachelBreite,
                  height: kachelHoehe,
                  backgroundColor: "#E8A020",
                },
              ]}
              onPress={zufallsGeschichte}
            >
              <Text style={styles.kachelEmoji}>🎲</Text>
              <Text style={styles.kachelTitel}>{t.randomMagic}</Text>
              <Text style={styles.kachelUnter}>{t.randomSub}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.kachel,
                {
                  width: kachelBreite,
                  height: kachelHoehe,
                  backgroundColor: "#E74C3C",
                },
              ]}
              onPress={() => router.push("/favoriten")}
            >
              <Text style={styles.kachelEmoji}>⭐</Text>
              <Text style={styles.kachelTitel}>{t.favorites}</Text>
              <Text style={styles.kachelUnter}>{t.favoritesSub}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.kachel,
                {
                  width: kachelBreite,
                  height: kachelHoehe,
                  backgroundColor: "#8E44AD",
                },
              ]}
              onPress={() => router.push("/schatz")}
            >
              <Text style={styles.kachelEmoji}>💎</Text>
              <Text style={styles.kachelTitel}>{t.treasure}</Text>
              <Text style={styles.kachelUnter}>{t.treasureSub}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.kachel,
                {
                  width: kachelBreite,
                  height: kachelHoehe,
                  backgroundColor: "#2D5016",
                },
              ]}
              onPress={() => router.push("/dashboard")}
            >
              <Text style={styles.kachelEmoji}>👨‍👩‍👧</Text>
              <Text style={styles.kachelTitel}>{t.parents}</Text>
              <Text style={styles.kachelUnter}>{t.parentsSub}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Einstellungen Modal */}
        <Modal
          visible={einstellungenModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setEinstellungenModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>⚙️ {t.settingsTitle}</Text>
                <TouchableOpacity onPress={() => setEinstellungenModal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* App-Sprache */}
                <View style={styles.einstellungsGruppe}>
                  <Text style={styles.einstellungsGruppeTitel}>
                    🌐 {t.appLanguage}
                  </Text>
                  <Text style={styles.einstellungsGruppeBeschreibung}>
                    {t.appLanguageDesc}
                  </Text>
                  <View style={styles.sprachGrid}>
                    {Object.keys(UI_TEXTE).map((code) => (
                      <TouchableOpacity
                        key={code}
                        style={[
                          styles.sprachChip,
                          appSprache === code && styles.sprachChipAktiv,
                        ]}
                        onPress={() => setAppSprache(code)}
                      >
                        <Text style={styles.sprachChipEmoji}>
                          {code === "de"
                            ? "🇩🇪"
                            : code === "en"
                              ? "🇬🇧"
                              : code === "fr"
                                ? "🇫🇷"
                                : code === "es"
                                  ? "🇪🇸"
                                  : code === "it"
                                    ? "🇮🇹"
                                    : "🇹🇷"}
                        </Text>
                        <Text
                          style={[
                            styles.sprachChipText,
                            appSprache === code && styles.sprachChipTextAktiv,
                          ]}
                        >
                          {code === "de"
                            ? "Deutsch"
                            : code === "en"
                              ? "English"
                              : code === "fr"
                                ? "Français"
                                : code === "es"
                                  ? "Español"
                                  : code === "it"
                                    ? "Italiano"
                                    : "Türkçe"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Vorlese-Sprache */}
                <View style={styles.einstellungsGruppe}>
                  <Text style={styles.einstellungsGruppeTitel}>
                    📢 {t.readingLanguage}
                  </Text>
                  <Text style={styles.einstellungsGruppeBeschreibung}>
                    {t.readingLanguageDesc}
                  </Text>
                  <View style={styles.sprachGrid}>
                    {SPRACH_OPTIONEN.map((sprache) => (
                      <TouchableOpacity
                        key={sprache.code}
                        style={[
                          styles.sprachChip,
                          vorleseSprache === sprache.code &&
                            styles.sprachChipAktiv,
                        ]}
                        onPress={() => setVorleseSprache(sprache.code)}
                      >
                        <Text style={styles.sprachChipEmoji}>
                          {sprache.flag}
                        </Text>
                        <Text
                          style={[
                            styles.sprachChipText,
                            vorleseSprache === sprache.code &&
                              styles.sprachChipTextAktiv,
                          ]}
                        >
                          {sprache.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Audio-Einstellungen */}
                <View style={styles.einstellungsGruppe}>
                  <Text style={styles.einstellungsGruppeTitel}>
                    🎙️ {t.audioSettings}
                  </Text>

                  <TouchableOpacity
                    style={styles.switchContainer}
                    onPress={() => setVerwendeGenreAudio(!verwendeGenreAudio)}
                  >
                    <Text style={styles.switchLabel}>{t.useGenreAudio}</Text>
                    <View
                      style={[
                        styles.switch,
                        verwendeGenreAudio && styles.switchAktiv,
                      ]}
                    >
                      <View
                        style={[
                          styles.switchKnopf,
                          verwendeGenreAudio && styles.switchKnopfAktiv,
                        ]}
                      />
                    </View>
                  </TouchableOpacity>

                  {verwendeGenreAudio ? (
                    <View style={styles.genreAudioInfo}>
                      <Text style={styles.genreAudioText}>
                        🎭 Für {getGenreName(genre)}:{" "}
                        {AUDIO_EINSTELLUNGEN[genre]?.description ||
                          AUDIO_EINSTELLUNGEN.default.description}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.sliderContainer}>
                        <Text style={styles.sliderLabel}>
                          {t.audioSpeed}: {audioRate.toFixed(2)}
                        </Text>
                        <View style={styles.sliderWrapper}>
                          <Text style={styles.sliderIcon}>🐢</Text>
                          <Slider
                            style={styles.slider}
                            minimumValue={0.5}
                            maximumValue={1.5}
                            step={0.01}
                            value={audioRate}
                            onValueChange={setAudioRate}
                            minimumTrackTintColor={genreFarbe}
                            maximumTrackTintColor="#5A3A8A"
                            thumbTintColor={genreFarbe}
                          />
                          <Text style={styles.sliderIcon}>🐇</Text>
                        </View>
                      </View>

                      <View style={styles.sliderContainer}>
                        <Text style={styles.sliderLabel}>
                          {t.audioPitch}: {audioPitch.toFixed(2)}
                        </Text>
                        <View style={styles.sliderWrapper}>
                          <Text style={styles.sliderIcon}>🐭</Text>
                          <Slider
                            style={styles.slider}
                            minimumValue={0.5}
                            maximumValue={1.5}
                            step={0.01}
                            value={audioPitch}
                            onValueChange={setAudioPitch}
                            minimumTrackTintColor={genreFarbe}
                            maximumTrackTintColor="#5A3A8A"
                            thumbTintColor={genreFarbe}
                          />
                          <Text style={styles.sliderIcon}>🐘</Text>
                        </View>
                      </View>
                    </>
                  )}

                  <TouchableOpacity
                    style={styles.testAudioBtn}
                    onPress={testeAudio}
                  >
                    <Text style={styles.testAudioBtnText}>
                      🔊 {t.testAudio}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.speichernBtn}
                  onPress={speichereEinstellungen}
                >
                  <Text style={styles.speichernBtnText}>
                    💾 {t.saveSettings}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  if (ansicht === "formular") {
    return (
      <View style={{ flex: 1, backgroundColor: "#1A0A3A" }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.formHeader, { backgroundColor: "#2D0A5A" }]}>
            <TouchableOpacity
              style={styles.zurueckBtn}
              onPress={() => setAnsicht("home")}
            >
              <Text style={styles.zurueckText}>🪄 {t.backHome}</Text>
            </TouchableOpacity>
            <Text style={styles.formTitel}>🪄 {t.newStory}</Text>
            <Text style={{ fontSize: 36 }}>{GENRE_EMOJI[genre]}</Text>
          </View>
          <View style={[styles.formular, { backgroundColor: "#1A0A3A" }]}>
            <View style={styles.karteZauber}>
              <Text style={styles.karteLabelZauber}>{t.howOld}</Text>
              <TextInput
                style={styles.inputZauber}
                value={alter}
                onChangeText={setAlter}
                keyboardType="numeric"
                placeholder="z.B. 5"
                placeholderTextColor="#9B8FC0"
              />
            </View>
            <View style={styles.karteZauber}>
              <Text style={styles.karteLabelZauber}>{t.whoPlays}</Text>
              <TextInput
                style={styles.inputZauber}
                value={akteure}
                onChangeText={setAkteure}
                placeholder="z.B. ein Drache und ein Zauberer"
                placeholderTextColor="#9B8FC0"
              />
              <Text style={styles.hinweisZauber}>{t.figureHint}</Text>
            </View>
            <View style={styles.karteZauber}>
              <Text style={styles.karteLabelZauber}>{t.howLong}</Text>
              <View style={styles.dauerGrid}>
                {DAUER_OPTIONEN.map((d) => (
                  <TouchableOpacity
                    key={d.wert}
                    style={[
                      styles.dauerChipZauber,
                      dauer === d.wert && {
                        backgroundColor: "#7B3FA0",
                        borderColor: "#9B59B6",
                      },
                    ]}
                    onPress={() => setDauer(d.wert)}
                  >
                    <Text
                      style={[
                        styles.dauerTextZauber,
                        dauer === d.wert && { color: "white" },
                      ]}
                    >
                      {getDauerLabel(d.wert)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.karteZauber}>
              <Text style={styles.karteLabelZauber}>{t.chooseGenre}</Text>
              <View style={styles.genreGrid}>
                {genres.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genreChipZauber,
                      genre === g && {
                        backgroundColor: GENRE_FARBE[g],
                        borderColor: GENRE_FARBE[g],
                      },
                    ]}
                    onPress={() => setGenre(g)}
                  >
                    <Text style={{ fontSize: 28, marginBottom: 4 }}>
                      {GENRE_EMOJI[g]}
                    </Text>
                    <Text
                      style={[
                        styles.genreTextZauber,
                        genre === g && { color: "white", fontWeight: "700" },
                      ]}
                    >
                      {getGenreName(g)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity
              style={styles.zauberStartBtn}
              onPress={generiereGeschichte}
            >
              <Text style={styles.zauberStartBtnText}>{t.startMagic}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  const seitenJson = JSON.stringify(seiten);
  const bilderJson = JSON.stringify(bildUrls);
  const aktuelleVorleseSprache = SPRACH_OPTIONEN.find(
    (s) => s.code === vorleseSprache,
  );

  const html = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<style>
* { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
body { background:#0D0625; font-family:'Georgia',serif; overflow:hidden; height:100vh; display:flex; flex-direction:column; }
.buch-welt { flex:1; display:flex; perspective:2000px; background:linear-gradient(135deg,#1A0A3A 0%,#0D0625 100%); padding:8px; position:relative; overflow:hidden; }
.buch { flex:1; display:flex; position:relative; border-radius:4px 12px 12px 4px; box-shadow:-8px 0 30px rgba(0,0,0,0.8),0 20px 60px rgba(0,0,0,0.6); }
.seite-links { display: none !important; width: 0; overflow: hidden; }
.seite-rechts { position: absolute; inset: 0; background: linear-gradient(135deg,#FFFEF5 0%,#FFF8E7 100%); border-radius: 12px; display: flex; flex-direction: column; transform-origin: left center; overflow: hidden; box-shadow: 4px 0 20px rgba(0,0,0,0.3); transition: box-shadow 0.1s; width: 100%; }
.seite-flipping { position: absolute; inset: 0; background: linear-gradient(135deg,#FFFEF5 0%,#FFF8E7 100%); border-radius: 12px; transform-origin: left center; display: flex; flex-direction: column; overflow: hidden; z-index: 100; width: 100%; backface-visibility: hidden; }
.seite-flipping-vorne { position: absolute; inset: 0; background: linear-gradient(135deg,#FFFEF5 0%,#FFF8E7 100%); border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; backface-visibility: hidden; }
.seite-flipping-hinten { position: absolute; inset: 0; background: linear-gradient(135deg,#F0EBE0 0%,#E8E0D0 100%); border-radius: 12px; transform: rotateY(180deg); backface-visibility: hidden; display: flex; align-items: center; justify-content: center; font-size: 36px; }
.seite-bild { width: 100%; height: 130px; object-fit: cover; border-radius: 12px 12px 0 0; }
.seite-kopf { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; font-size: 12px; font-weight: 700; background: rgba(0,0,0,0.03); }
.trennlinie { height: 2px; margin: 0 16px; background: linear-gradient(to right, transparent, currentColor, transparent); }
.seite-text-bereich { flex: 1; padding: 12px 20px; overflow-y: auto; font-size: 14px; line-height: 1.8; color: #2D3A1E; text-align: justify; }
.anfuehrung { font-size: 48px; line-height: 0.8; font-weight: 900; margin-bottom: -8px; display: inline-block; }
.ende-text { text-align: center; color: #6B8E23; font-style: italic; font-size: 12px; margin-top: 20px; }
.seite-fuss { padding: 8px 20px 16px; border-top: 1px solid rgba(0,0,0,0.1); }
.fuss-zeile { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.blatter-pfeil { font-size: 32px; font-weight: 900; padding: 8px 16px; cursor: pointer; user-select: none; opacity: 0.8; transition: transform 0.2s, opacity 0.2s; }
.blatter-pfeil:active { transform: scale(0.9); }
.blatter-pfeil.deaktiviert { opacity: 0.2; pointer-events: none; }
.seiten-nr { text-align: center; font-size: 12px; font-weight: 700; font-style: italic; margin-bottom: 6px; }
.fortschritt-balken { height: 4px; background: rgba(0,0,0,0.1); border-radius: 2px; overflow: hidden; }
.fortschritt-fill { height: 100%; border-radius: 2px; transition: width 0.5s ease; }
.flip-schatten { position: absolute; inset: 0; background: linear-gradient(to right, rgba(0,0,0,0.4), transparent); pointer-events: none; opacity: 0; z-index: 50; }
.like-box { background: linear-gradient(135deg,#2D0A5A,#1A0A3A); padding: 12px 16px; border-top: 1px solid rgba(123,63,160,0.5); display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 200; }
.like-box.sichtbar { display: block; animation: slideUp 0.3s ease; }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.like-frage { color: #E8D5FF; font-size: 14px; font-weight: 700; text-align: center; margin-bottom: 10px; font-family: sans-serif; }
.like-buttons { display: flex; justify-content: center; gap: 12px; }
.like-btn { display: flex; flex-direction: column; align-items: center; padding: 10px 16px; border-radius: 16px; border: 2px solid rgba(90,58,138,0.8); background: #1A0A3A; cursor: pointer; min-width: 80px; transition: transform 0.15s, background 0.2s; font-family: sans-serif; }
.like-btn:active { transform: scale(0.95); }
.like-btn.gut.aktiv { border-color: #27AE60; background: rgba(39,174,96,0.2); }
.like-btn.schlecht.aktiv { border-color: #E74C3C; background: rgba(231,76,60,0.2); }
.like-btn-emoji { font-size: 28px; }
.like-btn-text { font-size: 11px; color: #C0A0FF; margin-top: 4px; font-weight: 700; }
.like-btn.gut.aktiv .like-btn-text { color: #27AE60; }
.like-btn.schlecht.aktiv .like-btn-text { color: #E74C3C; }
.magi-btn { display: flex; flex-direction: column; align-items: center; padding: 10px 16px; border-radius: 16px; background: #7B3FA0; cursor: pointer; min-width: 70px; border: none; transition: transform 0.15s; font-family: sans-serif; }
.magi-btn:active { transform: scale(0.95); }
.magi-btn-text { font-size: 11px; color: white; margin-top: 4px; font-weight: 700; }
.danke-text { text-align: center; color: #FFD700; font-size: 12px; font-weight: 700; margin-top: 10px; font-family: sans-serif; display: none; animation: fadeIn 0.5s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
.wisch-hinweis { position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); background: rgba(123,63,160,0.9); color: white; font-size: 12px; padding: 8px 20px; border-radius: 30px; pointer-events: none; font-family: sans-serif; white-space: nowrap; transition: opacity 1s; z-index: 150; backdrop-filter: blur(4px); }
.wisch-hinweis.ausgeblendet { opacity: 0; visibility: hidden; }
.seite-text-bereich::-webkit-scrollbar { width: 6px; }
.seite-text-bereich::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); border-radius: 3px; }
.seite-text-bereich::-webkit-scrollbar-thumb { background: rgba(123,63,160,0.3); border-radius: 3px; }
</style>
</head>
<body>
<div class="buch-welt">
  <div class="buch">
    <div class="seite-links"></div>
    <div class="seite-rechts-container" id="flip-container" style="flex:1; position:relative;">
      <div class="seite-rechts" id="seite-aktuell">
        <img class="seite-bild" id="seite-bild" src="" />
        <div class="seite-kopf" id="seite-kopf">
          <span id="genre-label"></span>
          <span id="seiten-label"></span>
        </div>
        <div class="trennlinie" id="trennlinie"></div>
        <div class="seite-text-bereich" id="seite-text"></div>
        <div class="seite-fuss">
          <div class="fuss-zeile">
            <span class="blatter-pfeil" id="pfeil-links" onclick="blattereZurueck()">‹</span>
            <div style="flex:1;">
              <div class="seiten-nr" id="seiten-nr-unten"></div>
              <div class="fortschritt-balken"><div class="fortschritt-fill" id="fortschritt"></div></div>
            </div>
            <span class="blatter-pfeil" id="pfeil-rechts" onclick="blattereVor()">›</span>
          </div>
        </div>
        <div class="flip-schatten" id="flip-schatten"></div>
      </div>
      <div class="seite-flipping" id="seite-flipping" style="display:none">
        <div class="seite-flipping-vorne" id="flipping-vorne">
          <img class="seite-bild" id="flip-bild" src="" />
          <div class="seite-kopf" id="flip-kopf"></div>
          <div class="trennlinie"></div>
          <div class="seite-text-bereich" id="flip-text"></div>
          <div class="seite-fuss"><div class="seiten-nr" id="flip-nr"></div></div>
        </div>
        <div class="seite-flipping-hinten">✨</div>
      </div>
    </div>
  </div>
</div>
<div class="like-box" id="like-box">
  <div class="like-frage">✨ ${t.likeQuestion} ✨</div>
  <div class="like-buttons">
    <div class="like-btn gut" id="btn-gut" onclick="bewerte('gut')">
      <span class="like-btn-emoji">👍</span>
      <span class="like-btn-text">${t.great}</span>
    </div>
    <div class="like-btn schlecht" id="btn-schlecht" onclick="bewerte('schlecht')">
      <span class="like-btn-emoji">👎</span>
      <span class="like-btn-text">${t.notGood}</span>
    </div>
    <div class="magi-btn" onclick="geheHome()">
      <span style="font-size:20px">🪄</span>
      <span class="magi-btn-text">${t.backHome}</span>
    </div>
  </div>
  <div class="danke-text" id="danke-text"></div>
</div>
<div class="wisch-hinweis" id="wisch-hinweis">👆 ${t.swipeHint}</div>

<script>
const SEITEN = ${seitenJson};
const BILDER = ${bilderJson};
const FARBE = "${genreFarbe}";
const GEMOJI = "${GENRE_EMOJI[genre] || "📖"}";
const GNAME = "${getGenreName(genre)}";
let aktuelleSeite = ${aktuelleSeite};
let istFlipping = false;
let fingerStart = null;
let fingerAktuell = null;

const dynStyle = document.createElement('style');
dynStyle.textContent = \`
  .seite-kopf { background: \${FARBE}22 !important; color: \${FARBE} !important; }
  .trennlinie { background: linear-gradient(to right, transparent, \${FARBE}, transparent) !important; }
  .blatter-pfeil { color: \${FARBE} !important; }
  .seiten-nr { color: \${FARBE} !important; }
  .fortschritt-fill { background: \${FARBE} !important; }
  .anfuehrung { color: \${FARBE} !important; }
\`;
document.head.appendChild(dynStyle);

function zeigeSeite(nr) {
  const seite = SEITEN[nr];
  const bild = BILDER[nr];
  const istErste = nr === 0;
  const istLetzte = nr === SEITEN.length - 1;
  const bildEl = document.getElementById('seite-bild');
  if (bild && bildEl) { 
    bildEl.src = bild; 
    bildEl.style.display = 'block'; 
  } else if (bildEl) { 
    bildEl.style.display = 'none'; 
  }
  
  const genreLabel = document.getElementById('genre-label');
  if (genreLabel) genreLabel.textContent = GEMOJI + ' ' + GNAME;
  
  const seitenLabel = document.getElementById('seiten-label');
  if (seitenLabel) seitenLabel.textContent = '${t.page} ' + (nr + 1) + ' ${t.of} ' + SEITEN.length;
  
  const textEl = document.getElementById('seite-text');
  if (textEl) {
    let textInhalt = '';
    if (istErste) {
      textInhalt += '<div class="anfuehrung">\u201C</div>';
    }
    textInhalt += '<div>' + seite.replace(/\\n/g,'<br>') + '</div>';
    if (istLetzte) {
      textInhalt += '<div class="ende-text">✨ ~ ${t.end} ~ ✨</div>';
    }
    textEl.innerHTML = textInhalt;
    textEl.scrollTop = 0;
  }
  
  const seitenNrUnten = document.getElementById('seiten-nr-unten');
  if (seitenNrUnten) seitenNrUnten.textContent = '— ' + (nr+1) + ' / ' + SEITEN.length + ' —';
  
  const fortschritt = document.getElementById('fortschritt');
  if (fortschritt) fortschritt.style.width = ((nr+1)/SEITEN.length*100) + '%';
  
  const pfeilLinks = document.getElementById('pfeil-links');
  const pfeilRechts = document.getElementById('pfeil-rechts');
  if (pfeilLinks) pfeilLinks.classList.toggle('deaktiviert', nr === 0);
  if (pfeilRechts) pfeilRechts.classList.toggle('deaktiviert', nr === SEITEN.length-1);
  
  const likeBox = document.getElementById('like-box');
  if (likeBox) likeBox.classList.toggle('sichtbar', istLetzte);
  
  try { 
    window.ReactNativeWebView.postMessage(JSON.stringify({typ:'seite',wert:nr})); 
  } catch(e) {}
}

function blattereVor() {
  if (aktuelleSeite >= SEITEN.length-1 || istFlipping) return;
  animiere('vor');
}

function blattereZurueck() {
  if (aktuelleSeite <= 0 || istFlipping) return;
  animiere('zuruck');
}

function animiere(richtung) {
  if (istFlipping) return;
  istFlipping = true;
  const naechste = richtung === 'vor' ? aktuelleSeite+1 : aktuelleSeite-1;
  const flipEl = document.getElementById('seite-flipping');
  const schatten = document.getElementById('flip-schatten');
  const bild = BILDER[aktuelleSeite];
  const flipBild = document.getElementById('flip-bild');
  
  if (bild && flipBild) { 
    flipBild.src = bild; 
    flipBild.style.display = 'block'; 
  } else if (flipBild) { 
    flipBild.style.display = 'none'; 
  }
  
  const flipKopf = document.getElementById('flip-kopf');
  if (flipKopf) flipKopf.textContent = GEMOJI + ' ' + GNAME + ' • ${t.page} ' + (aktuelleSeite+1);
  
  const flipText = document.getElementById('flip-text');
  const aktuellerText = document.getElementById('seite-text');
  if (flipText && aktuellerText) flipText.innerHTML = aktuellerText.innerHTML;
  
  const flipNr = document.getElementById('flip-nr');
  if (flipNr) flipNr.textContent = '— ' + (aktuelleSeite+1) + ' / ' + SEITEN.length + ' —';
  
  if (flipEl) {
    flipEl.style.display = 'flex';
    flipEl.style.transition = 'none';
    flipEl.style.transform = 'rotateY(0deg)';
  }
  if (schatten) schatten.style.opacity = '0';
  
  setTimeout(() => {
    zeigeSeite(naechste);
    if (flipEl) {
      flipEl.style.transition = 'transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94),box-shadow 0.45s';
      flipEl.style.transform = richtung === 'vor' ? 'rotateY(-180deg)' : 'rotateY(180deg)';
      flipEl.style.boxShadow = richtung === 'vor' ? '-20px 0 60px rgba(0,0,0,0.5)' : '20px 0 60px rgba(0,0,0,0.5)';
    }
    if (schatten) {
      schatten.style.transition = 'opacity 0.45s';
      schatten.style.opacity = '0.3';
    }
    setTimeout(() => {
      if (flipEl) flipEl.style.display = 'none';
      if (schatten) schatten.style.opacity = '0';
      aktuelleSeite = naechste;
      istFlipping = false;
    }, 460);
  }, 10);
}

const container = document.getElementById('flip-container');
if (container) {
  container.addEventListener('touchstart', (e) => {
    fingerStart = e.touches[0].clientX;
    fingerAktuell = fingerStart;
    const hinweis = document.getElementById('wisch-hinweis');
    if (hinweis) hinweis.classList.add('ausgeblendet');
  }, {passive:true});

  container.addEventListener('touchmove', (e) => {
    if (!fingerStart || istFlipping) return;
    fingerAktuell = e.touches[0].clientX;
    const diff = fingerAktuell - fingerStart;
    const seiteEl = document.getElementById('seite-aktuell');
    if (Math.abs(diff) > 10 && seiteEl) {
      const winkel = Math.max(-45, Math.min(45, diff / 4));
      if (diff < 0 && aktuelleSeite < SEITEN.length-1) {
        seiteEl.style.transition = 'none';
        seiteEl.style.transform = 'rotateY(' + winkel + 'deg)';
        seiteEl.style.boxShadow = (-winkel*2) + 'px 0 ' + (-winkel*3) + 'px rgba(0,0,0,0.4)';
      } else if (diff > 0 && aktuelleSeite > 0) {
        seiteEl.style.transition = 'none';
        seiteEl.style.transform = 'rotateY(' + winkel + 'deg)';
        seiteEl.style.boxShadow = (winkel*2) + 'px 0 ' + (winkel*3) + 'px rgba(0,0,0,0.4)';
      }
    }
  }, {passive:true});

  container.addEventListener('touchend', (e) => {
    if (!fingerStart) return;
    const diff = fingerAktuell - fingerStart;
    const seiteEl = document.getElementById('seite-aktuell');
    if (seiteEl) {
      seiteEl.style.transition = 'transform 0.3s,box-shadow 0.3s';
      seiteEl.style.transform = 'rotateY(0deg)';
      seiteEl.style.boxShadow = '';
    }
    if (Math.abs(diff) > 60) {
      if (diff < 0 && aktuelleSeite < SEITEN.length-1) {
        setTimeout(() => animiere('vor'), 50);
      } else if (diff > 0 && aktuelleSeite > 0) {
        setTimeout(() => animiere('zuruck'), 50);
      }
    }
    fingerStart = null;
    fingerAktuell = null;
  }, {passive:true});
}

function bewerte(typ) {
  const btnGut = document.getElementById('btn-gut');
  const btnSchlecht = document.getElementById('btn-schlecht');
  if (btnGut && btnSchlecht && 
      (btnGut.classList.contains('aktiv') || btnSchlecht.classList.contains('aktiv'))) return;
  
  if (typ === 'gut' && btnGut) btnGut.classList.add('aktiv');
  if (typ === 'schlecht' && btnSchlecht) btnSchlecht.classList.add('aktiv');
  
  const danke = document.getElementById('danke-text');
  if (danke) {
    danke.style.display = 'block';
    danke.textContent = typ === 'gut' ? '🌟 ${t.saved}' : '😊 ${t.thanks}';
    setTimeout(() => {
      danke.style.opacity = '0';
      setTimeout(() => {
        if (danke) danke.style.display = 'none';
        if (danke) danke.style.opacity = '1';
      }, 500);
    }, 2000);
  }
  
  try { 
    window.ReactNativeWebView.postMessage(JSON.stringify({typ:'bewertung',wert:typ})); 
  } catch(e) {}
}

function geheHome() {
  try { 
    window.ReactNativeWebView.postMessage(JSON.stringify({typ:'home'})); 
  } catch(e) {}
}

zeigeSeite(aktuelleSeite);

setTimeout(() => {
  const hinweis = document.getElementById('wisch-hinweis');
  if (hinweis) hinweis.classList.add('ausgeblendet');
}, 4000);
</script>
</body>
</html>`;

  let WebViewComponent: any = null;
  try {
    WebViewComponent = require("react-native-webview").WebView;
  } catch {}

  return (
    <View style={{ flex: 1, backgroundColor: "#0D0625" }}>
      <View style={[styles.leseHeaderBar, { backgroundColor: "#2D0A5A" }]}>
        <TouchableOpacity
          style={styles.zurueckBtn}
          onPress={() => {
            stoppeAudio();
            speichereLesefortschritt({
              geschichteId,
              titel,
              genre,
              aktuelleSeite,
              gesamtSeiten: seiten.length,
              datum: new Date().toLocaleDateString("de-DE"),
            });
            setGeschichte("");
            setAnsicht("home");
          }}
        >
          <Text style={styles.zurueckText}>🪄 {t.backHome}</Text>
        </TouchableOpacity>
        <Text style={styles.leseTitelBar} numberOfLines={1}>
          {titel}
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {aktuelleVorleseSprache && (
            <Text style={styles.sprachIcon}>{aktuelleVorleseSprache.flag}</Text>
          )}
          <TouchableOpacity
            style={[
              styles.audioButtonMini,
              { backgroundColor: sprichtGerade ? "#E74C3C" : "#7B3FA0" },
            ]}
            onPress={sprichtGerade ? stoppeAudio : starteAudio}
          >
            <Text style={{ fontSize: 18 }}>{sprichtGerade ? "⏹️" : "🔊"}</Text>
          </TouchableOpacity>
        </View>
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
                if (data.typ === "seite") {
                  setAktuelleSeite(data.wert);
                } else if (data.typ === "bewertung") {
                  bewerte(data.wert as "gut" | "schlecht");
                } else if (data.typ === "home") {
                  stoppeAudio();
                  setGeschichte("");
                  loescheLesefortschritt();
                  setAnsicht("home");
                }
              } catch {}
            }}
          />
        ) : (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Text
              style={{
                color: "#FFD700",
                fontSize: 16,
                textAlign: "center",
                padding: 20,
              }}
            >
              📦 WebView wird installiert...{"\n"}Bitte im Terminal eingeben:
              {"\n"}
              npx expo install react-native-webview
            </Text>
            <TouchableOpacity
              style={[styles.zauberStartBtn, { margin: 20 }]}
              onPress={() => {
                stoppeAudio();
                setGeschichte("");
                setAnsicht("home");
              }}
            >
              <Text style={styles.zauberStartBtnText}>🪄 {t.backHome}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

// ==================== APP_SPRACHEN für die Anzeige ====================
const APP_SPRACHEN = [
  { code: "de", name: "Deutsch", flag: "🇩🇪", nativeName: "Deutsch" },
  { code: "en", name: "English", flag: "🇬🇧", nativeName: "English" },
  { code: "fr", name: "Français", flag: "🇫🇷", nativeName: "Français" },
  { code: "es", name: "Español", flag: "🇪🇸", nativeName: "Español" },
  { code: "it", name: "Italiano", flag: "🇮🇹", nativeName: "Italiano" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷", nativeName: "Türkçe" },
];

const styles = StyleSheet.create({
  himmel: {
    backgroundColor: "#1A0A3A",
    paddingTop: 44,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  lichtstrahl1: {
    position: "absolute",
    top: 0,
    left: width * 0.2,
    width: 3,
    height: "100%",
    backgroundColor: "rgba(180,130,255,0.08)",
    transform: [{ rotate: "15deg" }],
  },
  lichtstrahl2: {
    position: "absolute",
    top: 0,
    left: width * 0.6,
    width: 3,
    height: "100%",
    backgroundColor: "rgba(255,215,0,0.06)",
    transform: [{ rotate: "-10deg" }],
  },
  einstellungenBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 100,
    backgroundColor: "rgba(123,63,160,0.8)",
    borderRadius: 30,
    padding: 10,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  einstellungenBtnText: {
    fontSize: 24,
  },
  sprachAnzeige: {
    fontSize: 11,
    color: "#FFD700",
    marginTop: 4,
    fontWeight: "600",
  },
  sprachIcon: {
    fontSize: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logoContainer: { alignItems: "center", marginBottom: 4, marginTop: 4 },
  logoText: {
    fontWeight: "900",
    color: "#FFD700",
    textShadowColor: "rgba(255,180,0,0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  logoUnter: {
    fontSize: 12,
    color: "rgba(200,180,255,0.9)",
    fontWeight: "600",
    marginTop: 2,
  },
  zauberCharakter: { alignItems: "center", marginVertical: 4 },
  zauberStab: { fontSize: 24, marginBottom: -8 },
  zauberFigur: {},
  zauberGlitzer: { flexDirection: "row", gap: 6, marginTop: -8 },
  dekoZeile: { flexDirection: "row", gap: 10, marginTop: 8, paddingBottom: 8 },
  hauptBereich: {
    flex: 1,
    backgroundColor: "#F0E8FF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
    paddingTop: 16,
    paddingHorizontal: 14,
  },
  hauptBtn: {
    backgroundColor: "#7B3FA0",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    elevation: 10,
    shadowColor: "#7B3FA0",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  hauptBtnInnen: { flexDirection: "row", alignItems: "center", gap: 12 },
  hauptBtnEmoji: { fontSize: 36 },
  hauptBtnTitel: { fontSize: 18, fontWeight: "900", color: "white" },
  hauptBtnUnter: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  hauptBtnPfeil: { fontSize: 20, color: "white", fontWeight: "900" },
  weiterlesenBtn: {
    backgroundColor: "#2D0A5A",
    borderRadius: 16,
    padding: 12,
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
    marginTop: 1,
    maxWidth: width * 0.45,
  },
  weiterlesenSeite: { fontSize: 10, color: "#9B8FC0", marginTop: 1 },
  weiterlesenFortschritt: { alignItems: "flex-end", gap: 4 },
  weiterlesenBalken: {
    width: 50,
    height: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  weiterlesenFull: {
    height: "100%",
    backgroundColor: "#FFD700",
    borderRadius: 3,
  },
  weiterlesenPfeil: { fontSize: 16, color: "#FFD700", fontWeight: "900" },
  kachelGrid: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 12 },
  kachel: {
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  kachelEmoji: { fontSize: 34, marginBottom: 6 },
  kachelTitel: {
    fontSize: 13,
    fontWeight: "900",
    color: "white",
    textAlign: "center",
  },
  kachelUnter: {
    fontSize: 10,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
    textAlign: "center",
  },
  formHeader: {
    padding: 20,
    paddingTop: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  formTitel: { fontSize: 18, fontWeight: "900", color: "white" },
  formular: { padding: 14 },
  karteZauber: {
    backgroundColor: "#2D0A5A",
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#5A3A8A",
  },
  karteLabelZauber: {
    fontSize: 16,
    fontWeight: "800",
    color: "#E8D5FF",
    marginBottom: 10,
  },
  hinweisZauber: { fontSize: 11, color: "#9B8FC0", marginTop: 6 },
  inputZauber: {
    borderWidth: 2,
    borderColor: "#7B3FA0",
    borderRadius: 14,
    padding: 12,
    fontSize: 15,
    backgroundColor: "#1A0A3A",
    color: "#E8D5FF",
  },
  dauerGrid: { flexDirection: "row", gap: 6 },
  dauerChipZauber: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#5A3A8A",
    borderRadius: 14,
    padding: 8,
    alignItems: "center",
    backgroundColor: "#1A0A3A",
  },
  dauerTextZauber: { fontSize: 11, fontWeight: "700", color: "#C0A0FF" },
  genreGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  genreChipZauber: {
    borderWidth: 2,
    borderColor: "#5A3A8A",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#1A0A3A",
    alignItems: "center",
    minWidth: 80,
  },
  genreTextZauber: { fontSize: 11, fontWeight: "600", color: "#C0A0FF" },
  zauberStartBtn: {
    backgroundColor: "#7B3FA0",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginTop: 8,
    elevation: 10,
    shadowColor: "#7B3FA0",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  zauberStartBtnText: { color: "white", fontSize: 20, fontWeight: "900" },
  ladeContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  ladeBox: {
    alignItems: "center",
    backgroundColor: "#2D0A5A",
    borderRadius: 32,
    padding: 50,
    elevation: 6,
  },
  ladeTitel: {
    fontSize: 20,
    fontWeight: "800",
    color: "#E8D5FF",
    marginTop: 16,
  },
  ladeUnter: { fontSize: 15, color: "#9B8FC0", marginTop: 8 },
  leseHeaderBar: {
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leseTitelBar: {
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
  audioButtonMini: { borderRadius: 20, padding: 10, elevation: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#1A0A3A",
    borderRadius: 28,
    width: width * 0.9,
    maxHeight: height * 0.8,
    padding: 20,
    borderWidth: 1,
    borderColor: "#7B3FA0",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#7B3FA0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFD700",
  },
  modalClose: {
    fontSize: 24,
    color: "#9B8FC0",
    fontWeight: "bold",
    padding: 5,
  },
  einstellungsGruppe: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: "#2D0A5A",
    borderRadius: 16,
  },
  einstellungsGruppeTitel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFD700",
    marginBottom: 6,
  },
  einstellungsGruppeBeschreibung: {
    fontSize: 12,
    color: "#9B8FC0",
    marginBottom: 12,
  },
  sprachGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  sprachChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1A0A3A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#5A3A8A",
  },
  sprachChipAktiv: {
    backgroundColor: "#7B3FA0",
    borderColor: "#FFD700",
  },
  sprachChipEmoji: {
    fontSize: 16,
  },
  sprachChipText: {
    fontSize: 12,
    color: "#C0A0FF",
    fontWeight: "600",
  },
  sprachChipTextAktiv: {
    color: "white",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1A0A3A",
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
  switchLabel: {
    fontSize: 13,
    color: "#E8D5FF",
    fontWeight: "600",
    flex: 1,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 15,
    backgroundColor: "#5A3A8A",
    padding: 2,
  },
  switchAktiv: {
    backgroundColor: "#7B3FA0",
  },
  switchKnopf: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "white",
  },
  switchKnopfAktiv: {
    transform: [{ translateX: 22 }],
  },
  sliderContainer: {
    marginVertical: 10,
  },
  sliderLabel: {
    fontSize: 13,
    color: "#E8D5FF",
    fontWeight: "600",
    marginBottom: 6,
  },
  sliderWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderIcon: {
    fontSize: 18,
  },
  genreAudioInfo: {
    backgroundColor: "#1A0A3A",
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
  genreAudioText: {
    fontSize: 12,
    color: "#C0A0FF",
    textAlign: "center",
  },
  testAudioBtn: {
    backgroundColor: "#5A3A8A",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginTop: 12,
  },
  testAudioBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  speichernBtn: {
    backgroundColor: "#7B3FA0",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  speichernBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
});
