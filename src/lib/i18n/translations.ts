export type Locale = "en" | "es" | "fr" | "de" | "ja";

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ja: "日本語",
};

export interface Translations {
  // Nav
  nav_home: string;
  nav_scenes: string;
  nav_pricing: string;
  nav_login: string;
  nav_register: string;
  nav_dashboard: string;
  nav_upload: string;
  nav_vo_tools: string;
  nav_marketplace: string;

  // Common
  common_save: string;
  common_cancel: string;
  common_delete: string;
  common_edit: string;
  common_loading: string;
  common_search: string;
  common_back: string;
  common_next: string;
  common_submit: string;
  common_close: string;
  common_copy: string;
  common_share: string;

  // Auth
  auth_sign_in: string;
  auth_sign_up: string;
  auth_sign_out: string;
  auth_email: string;
  auth_password: string;
  auth_forgot_password: string;
  auth_reset_password: string;
  auth_name: string;

  // Dashboard
  dash_scripts: string;
  dash_history: string;
  dash_stats: string;
  dash_subscription: string;
  dash_credits: string;
  dash_referrals: string;
  dash_auditions: string;

  // Rehearsal
  rehearse_start: string;
  rehearse_stop: string;
  rehearse_pause: string;
  rehearse_play: string;
  rehearse_next_line: string;
  rehearse_prev_line: string;
  rehearse_modes: string;

  // Pricing
  pricing_free: string;
  pricing_pro: string;
  pricing_studio: string;
  pricing_per_month: string;
  pricing_subscribe: string;
  pricing_current_plan: string;
  pricing_upgrade: string;

  // VO Tools
  vo_adr: string;
  vo_pronunciation: string;
  vo_copy_timing: string;
  vo_breath_detector: string;
  vo_audio_monitor: string;
  vo_voice_consistency: string;
  vo_demo_reel: string;
  vo_client_delivery: string;
  vo_rate_calculator: string;
  vo_waveform_editor: string;

  // Misc
  misc_record: string;
  misc_stop_recording: string;
  misc_play_back: string;
  misc_download: string;
  misc_export: string;
  misc_settings: string;
}

export const translations: Record<Locale, Translations> = {
  en: {
    nav_home: "Home",
    nav_scenes: "Scenes",
    nav_pricing: "Pricing",
    nav_login: "Sign In",
    nav_register: "Create Account",
    nav_dashboard: "Dashboard",
    nav_upload: "Upload Script",
    nav_vo_tools: "VO Tools",
    nav_marketplace: "Marketplace",
    common_save: "Save",
    common_cancel: "Cancel",
    common_delete: "Delete",
    common_edit: "Edit",
    common_loading: "Loading...",
    common_search: "Search",
    common_back: "Back",
    common_next: "Next",
    common_submit: "Submit",
    common_close: "Close",
    common_copy: "Copy",
    common_share: "Share",
    auth_sign_in: "Sign In",
    auth_sign_up: "Create Account",
    auth_sign_out: "Sign Out",
    auth_email: "Email",
    auth_password: "Password",
    auth_forgot_password: "Forgot password?",
    auth_reset_password: "Reset Password",
    auth_name: "Name",
    dash_scripts: "Scripts",
    dash_history: "History",
    dash_stats: "Stats",
    dash_subscription: "Subscription",
    dash_credits: "Credits",
    dash_referrals: "Referrals",
    dash_auditions: "Auditions",
    rehearse_start: "Start Rehearsal",
    rehearse_stop: "Stop",
    rehearse_pause: "Pause",
    rehearse_play: "Play",
    rehearse_next_line: "Next Line",
    rehearse_prev_line: "Previous Line",
    rehearse_modes: "Rehearsal Modes",
    pricing_free: "Free",
    pricing_pro: "Pro",
    pricing_studio: "Studio",
    pricing_per_month: "/month",
    pricing_subscribe: "Subscribe",
    pricing_current_plan: "Current Plan",
    pricing_upgrade: "Upgrade",
    vo_adr: "ADR & Dubbing",
    vo_pronunciation: "Pronunciation Coach",
    vo_copy_timing: "Copy Timing",
    vo_breath_detector: "Breath Detector",
    vo_audio_monitor: "Audio Monitor",
    vo_voice_consistency: "Voice Consistency",
    vo_demo_reel: "Demo Reel",
    vo_client_delivery: "Client Delivery",
    vo_rate_calculator: "Rate Calculator",
    vo_waveform_editor: "Waveform Editor",
    misc_record: "Record",
    misc_stop_recording: "Stop Recording",
    misc_play_back: "Play Back",
    misc_download: "Download",
    misc_export: "Export",
    misc_settings: "Settings",
  },
  es: {
    nav_home: "Inicio",
    nav_scenes: "Escenas",
    nav_pricing: "Precios",
    nav_login: "Iniciar Sesión",
    nav_register: "Crear Cuenta",
    nav_dashboard: "Panel",
    nav_upload: "Subir Guión",
    nav_vo_tools: "Herramientas VO",
    nav_marketplace: "Mercado",
    common_save: "Guardar",
    common_cancel: "Cancelar",
    common_delete: "Eliminar",
    common_edit: "Editar",
    common_loading: "Cargando...",
    common_search: "Buscar",
    common_back: "Atrás",
    common_next: "Siguiente",
    common_submit: "Enviar",
    common_close: "Cerrar",
    common_copy: "Copiar",
    common_share: "Compartir",
    auth_sign_in: "Iniciar Sesión",
    auth_sign_up: "Crear Cuenta",
    auth_sign_out: "Cerrar Sesión",
    auth_email: "Correo",
    auth_password: "Contraseña",
    auth_forgot_password: "¿Olvidaste tu contraseña?",
    auth_reset_password: "Restablecer Contraseña",
    auth_name: "Nombre",
    dash_scripts: "Guiones",
    dash_history: "Historial",
    dash_stats: "Estadísticas",
    dash_subscription: "Suscripción",
    dash_credits: "Créditos",
    dash_referrals: "Referidos",
    dash_auditions: "Audiciones",
    rehearse_start: "Iniciar Ensayo",
    rehearse_stop: "Detener",
    rehearse_pause: "Pausar",
    rehearse_play: "Reproducir",
    rehearse_next_line: "Siguiente Línea",
    rehearse_prev_line: "Línea Anterior",
    rehearse_modes: "Modos de Ensayo",
    pricing_free: "Gratis",
    pricing_pro: "Pro",
    pricing_studio: "Studio",
    pricing_per_month: "/mes",
    pricing_subscribe: "Suscribirse",
    pricing_current_plan: "Plan Actual",
    pricing_upgrade: "Mejorar Plan",
    vo_adr: "ADR y Doblaje",
    vo_pronunciation: "Entrenador de Pronunciación",
    vo_copy_timing: "Calibrador de Tiempo",
    vo_breath_detector: "Detector de Respiración",
    vo_audio_monitor: "Monitor de Audio",
    vo_voice_consistency: "Consistencia de Voz",
    vo_demo_reel: "Demo Reel",
    vo_client_delivery: "Entrega al Cliente",
    vo_rate_calculator: "Calculadora de Tarifas",
    vo_waveform_editor: "Editor de Onda",
    misc_record: "Grabar",
    misc_stop_recording: "Detener Grabación",
    misc_play_back: "Reproducir",
    misc_download: "Descargar",
    misc_export: "Exportar",
    misc_settings: "Configuración",
  },
  fr: {
    nav_home: "Accueil",
    nav_scenes: "Scènes",
    nav_pricing: "Tarifs",
    nav_login: "Connexion",
    nav_register: "Créer un Compte",
    nav_dashboard: "Tableau de Bord",
    nav_upload: "Importer un Script",
    nav_vo_tools: "Outils VO",
    nav_marketplace: "Marché",
    common_save: "Enregistrer",
    common_cancel: "Annuler",
    common_delete: "Supprimer",
    common_edit: "Modifier",
    common_loading: "Chargement...",
    common_search: "Rechercher",
    common_back: "Retour",
    common_next: "Suivant",
    common_submit: "Soumettre",
    common_close: "Fermer",
    common_copy: "Copier",
    common_share: "Partager",
    auth_sign_in: "Connexion",
    auth_sign_up: "Créer un Compte",
    auth_sign_out: "Déconnexion",
    auth_email: "E-mail",
    auth_password: "Mot de passe",
    auth_forgot_password: "Mot de passe oublié ?",
    auth_reset_password: "Réinitialiser",
    auth_name: "Nom",
    dash_scripts: "Scripts",
    dash_history: "Historique",
    dash_stats: "Statistiques",
    dash_subscription: "Abonnement",
    dash_credits: "Crédits",
    dash_referrals: "Parrainages",
    dash_auditions: "Auditions",
    rehearse_start: "Commencer la Répétition",
    rehearse_stop: "Arrêter",
    rehearse_pause: "Pause",
    rehearse_play: "Lire",
    rehearse_next_line: "Ligne Suivante",
    rehearse_prev_line: "Ligne Précédente",
    rehearse_modes: "Modes de Répétition",
    pricing_free: "Gratuit",
    pricing_pro: "Pro",
    pricing_studio: "Studio",
    pricing_per_month: "/mois",
    pricing_subscribe: "S'abonner",
    pricing_current_plan: "Plan Actuel",
    pricing_upgrade: "Améliorer",
    vo_adr: "ADR et Doublage",
    vo_pronunciation: "Coach Prononciation",
    vo_copy_timing: "Calibrateur de Timing",
    vo_breath_detector: "Détecteur de Souffle",
    vo_audio_monitor: "Moniteur Audio",
    vo_voice_consistency: "Cohérence Vocale",
    vo_demo_reel: "Bande Démo",
    vo_client_delivery: "Livraison Client",
    vo_rate_calculator: "Calculateur de Tarifs",
    vo_waveform_editor: "Éditeur Audio",
    misc_record: "Enregistrer",
    misc_stop_recording: "Arrêter",
    misc_play_back: "Écouter",
    misc_download: "Télécharger",
    misc_export: "Exporter",
    misc_settings: "Paramètres",
  },
  de: {
    nav_home: "Startseite",
    nav_scenes: "Szenen",
    nav_pricing: "Preise",
    nav_login: "Anmelden",
    nav_register: "Konto Erstellen",
    nav_dashboard: "Dashboard",
    nav_upload: "Skript Hochladen",
    nav_vo_tools: "VO Werkzeuge",
    nav_marketplace: "Marktplatz",
    common_save: "Speichern",
    common_cancel: "Abbrechen",
    common_delete: "Löschen",
    common_edit: "Bearbeiten",
    common_loading: "Laden...",
    common_search: "Suchen",
    common_back: "Zurück",
    common_next: "Weiter",
    common_submit: "Absenden",
    common_close: "Schließen",
    common_copy: "Kopieren",
    common_share: "Teilen",
    auth_sign_in: "Anmelden",
    auth_sign_up: "Konto Erstellen",
    auth_sign_out: "Abmelden",
    auth_email: "E-Mail",
    auth_password: "Passwort",
    auth_forgot_password: "Passwort vergessen?",
    auth_reset_password: "Passwort Zurücksetzen",
    auth_name: "Name",
    dash_scripts: "Skripte",
    dash_history: "Verlauf",
    dash_stats: "Statistiken",
    dash_subscription: "Abonnement",
    dash_credits: "Guthaben",
    dash_referrals: "Empfehlungen",
    dash_auditions: "Vorsprechen",
    rehearse_start: "Probe Starten",
    rehearse_stop: "Stopp",
    rehearse_pause: "Pause",
    rehearse_play: "Abspielen",
    rehearse_next_line: "Nächste Zeile",
    rehearse_prev_line: "Vorherige Zeile",
    rehearse_modes: "Probenmodi",
    pricing_free: "Kostenlos",
    pricing_pro: "Pro",
    pricing_studio: "Studio",
    pricing_per_month: "/Monat",
    pricing_subscribe: "Abonnieren",
    pricing_current_plan: "Aktueller Plan",
    pricing_upgrade: "Upgrade",
    vo_adr: "ADR & Synchron",
    vo_pronunciation: "Aussprache-Coach",
    vo_copy_timing: "Timing-Kalibrator",
    vo_breath_detector: "Atem-Detektor",
    vo_audio_monitor: "Audio-Monitor",
    vo_voice_consistency: "Stimmkonsistenz",
    vo_demo_reel: "Demo Reel",
    vo_client_delivery: "Kundenlieferung",
    vo_rate_calculator: "Honorar-Rechner",
    vo_waveform_editor: "Wellenform-Editor",
    misc_record: "Aufnehmen",
    misc_stop_recording: "Aufnahme Stoppen",
    misc_play_back: "Abspielen",
    misc_download: "Herunterladen",
    misc_export: "Exportieren",
    misc_settings: "Einstellungen",
  },
  ja: {
    nav_home: "ホーム",
    nav_scenes: "シーン",
    nav_pricing: "料金",
    nav_login: "ログイン",
    nav_register: "アカウント作成",
    nav_dashboard: "ダッシュボード",
    nav_upload: "スクリプトをアップロード",
    nav_vo_tools: "VOツール",
    nav_marketplace: "マーケットプレイス",
    common_save: "保存",
    common_cancel: "キャンセル",
    common_delete: "削除",
    common_edit: "編集",
    common_loading: "読み込み中...",
    common_search: "検索",
    common_back: "戻る",
    common_next: "次へ",
    common_submit: "送信",
    common_close: "閉じる",
    common_copy: "コピー",
    common_share: "共有",
    auth_sign_in: "ログイン",
    auth_sign_up: "アカウント作成",
    auth_sign_out: "ログアウト",
    auth_email: "メール",
    auth_password: "パスワード",
    auth_forgot_password: "パスワードを忘れた場合",
    auth_reset_password: "パスワードリセット",
    auth_name: "名前",
    dash_scripts: "スクリプト",
    dash_history: "履歴",
    dash_stats: "統計",
    dash_subscription: "サブスクリプション",
    dash_credits: "クレジット",
    dash_referrals: "紹介",
    dash_auditions: "オーディション",
    rehearse_start: "リハーサル開始",
    rehearse_stop: "停止",
    rehearse_pause: "一時停止",
    rehearse_play: "再生",
    rehearse_next_line: "次のセリフ",
    rehearse_prev_line: "前のセリフ",
    rehearse_modes: "リハーサルモード",
    pricing_free: "無料",
    pricing_pro: "プロ",
    pricing_studio: "スタジオ",
    pricing_per_month: "/月",
    pricing_subscribe: "購読",
    pricing_current_plan: "現在のプラン",
    pricing_upgrade: "アップグレード",
    vo_adr: "ADR・吹替",
    vo_pronunciation: "発音コーチ",
    vo_copy_timing: "タイミング",
    vo_breath_detector: "ブレス検出",
    vo_audio_monitor: "オーディオモニター",
    vo_voice_consistency: "声の一貫性",
    vo_demo_reel: "デモリール",
    vo_client_delivery: "クライアント納品",
    vo_rate_calculator: "料金計算",
    vo_waveform_editor: "波形エディタ",
    misc_record: "録音",
    misc_stop_recording: "録音停止",
    misc_play_back: "再生",
    misc_download: "ダウンロード",
    misc_export: "エクスポート",
    misc_settings: "設定",
  },
};
