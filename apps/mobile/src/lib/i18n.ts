/**
 * Sistema de internacionalización (i18n) para KINETIXFITT
 * Soporte multi-idioma: español (es), inglés (en), portugués (pt)
 */

export type Locale = 'es' | 'en' | 'pt';

export interface Translation {
  common: {
    app: string;
    loading: string;
    error: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    close: string;
    search: string;
    filter: string;
    export: string;
    import: string;
    settings: string;
    profile: string;
    logout: string;
    login: string;
    register: string;
    back: string;
    next: string;
    previous: string;
    finish: string;
    start: string;
    stop: string;
    pause: string;
    resume: string;
    retry: string;
    refresh: string;
    confirm: string;
    yes: string;
    no: string;
    ok: string;
    success: string;
    failed: string;
    required: string;
    optional: string;
    showMore: string;
    showLess: string;
    learnMore: string;
    readMore: string;
    viewAll: string;
    selectAll: string;
    deselectAll: string;
    sortBy: string;
    ascending: string;
    descending: string;
    today: string;
    yesterday: string;
    tomorrow: string;
    daysAgo: string;
    weeksAgo: string;
    monthsAgo: string;
    yearsAgo: string;
  };
  nav: {
    features: string;
    plans: string;
    download: string;
    menu: string;
  };
  auth: {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    forgotPassword: string;
    createAccount: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
    signIn: string;
    signUp: string;
    signOut: string;
    rememberMe: string;
    socialLogin: string;
    googleLogin: string;
    appleLogin: string;
    demoTrainer: string;
    demoClient: string;
    invalidCredentials: string;
    connectionError: string;
    passwordResetSent: string;
    passwordResetFailed: string;
    weakPassword: string;
    passwordMismatch: string;
    invalidEmail: string;
    accountCreated: string;
    welcomeBack: string;
  };
  dashboard: {
    title: string;
    welcome: string;
    todaysWorkout: string;
    weeklyProgress: string;
    adherence: string;
    streak: string;
    prs: string;
    upcomingCheckIn: string;
    messageCoach: string;
    quickActions: string;
    startWorkout: string;
    logMeal: string;
    trackProgress: string;
    viewProgram: string;
    statsTitle: string;
    workoutsCompleted: string;
    totalVolume: string;
    avgIntensity: string;
    caloriesBurned: string;
  };
  workout: {
    title: string;
    startWorkout: string;
    finishWorkout: string;
    skipExercise: string;
    nextExercise: string;
    previousExercise: string;
    restTimer: string;
    startRest: string;
    skipRest: string;
    sets: string;
    reps: string;
    weight: string;
    rpe: string;
    rir: string;
    notes: string;
    addSet: string;
    removeSet: string;
    exerciseComplete: string;
    workoutComplete: string;
    greatJob: string;
    restTime: string;
    seconds: string;
    minutes: string;
    warmup: string;
    mainWorkout: string;
    cooldown: string;
    superset: string;
    dropset: string;
    giantSet: string;
    amrap: string;
    emom: string;
    tabata: string;
    hiit: string;
  };
  nutrition: {
    title: string;
    dailyCalories: string;
    targetCalories: string;
    consumed: string;
    remaining: string;
    macros: string;
    protein: string;
    carbs: string;
    fats: string;
    fiber: string;
    water: string;
    addMeal: string;
    addFood: string;
    scanBarcode: string;
    recentFoods: string;
    favoriteFoods: string;
    mealPlan: string;
    breakfast: string;
    lunch: string;
    dinner: string;
    snack: string;
    preworkout: string;
    postworkout: string;
    calorieDeficit: string;
    calorieSurplus: string;
    maintenance: string;
  };
  progress: {
    title: string;
    weight: string;
    measurements: string;
    photos: string;
    takePhoto: string;
    uploadPhoto: string;
    beforeAfter: string;
    compare: string;
    timeline: string;
    addEntry: string;
    viewHistory: string;
    currentWeight: string;
    startingWeight: string;
    goalWeight: string;
    weightChange: string;
    bodyFat: string;
    muscleMass: string;
    bmi: string;
    waist: string;
    hips: string;
    chest: string;
    arms: string;
    legs: string;
    neck: string;
  };
  messages: {
    title: string;
    sendMessage: string;
    typeMessage: string;
    send: string;
    coachResponse: string;
    waitingResponse: string;
    newMessage: string;
    markAsRead: string;
    archive: string;
    delete: string;
    attachment: string;
    voiceMessage: string;
    typing: string;
    online: string;
    offline: string;
    lastSeen: string;
  };
  timers: {
    title: string;
    stopwatch: string;
    countdown: string;
    hiit: string;
    tabata: string;
    emom: string;
    amrap: string;
    custom: string;
    start: string;
    pause: string;
    reset: string;
    laps: string;
    lap: string;
    totalTime: string;
    avgLap: string;
    bestLap: string;
    workInterval: string;
    restInterval: string;
    rounds: string;
    prepare: string;
    getReady: string;
    rest: string;
    work: string;
    finished: string;
  };
  achievements: {
    title: string;
    unlocked: string;
    locked: string;
    progress: string;
    claim: string;
    claimed: string;
    totalPoints: string;
    level: string;
    xp: string;
    nextLevel: string;
    badges: string;
    trophies: string;
    milestones: string;
    challenges: string;
    dailyChallenge: string;
    weeklyChallenge: string;
    monthlyChallenge: string;
    completed: string;
    inProgress: string;
    reward: string;
  };
  settings: {
    title: string;
    general: string;
    notifications: string;
    privacy: string;
    language: string;
    theme: string;
    darkMode: string;
    lightMode: string;
    systemTheme: string;
    units: string;
    metric: string;
    imperial: string;
    firstDayOfWeek: string;
    timeFormat: string;
    dateFormat: string;
    timezone: string;
    dataExport: string;
    deleteAccount: string;
    changePassword: string;
    twoFactorAuth: string;
    connectedApps: string;
    billing: string;
    subscription: string;
    paymentMethod: string;
    invoices: string;
    cancelSubscription: string;
  };
  onboarding: {
    welcome: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
    goalLabel: string;
    daysLabel: string;
    placeLabel: string;
    experienceLabel: string;
    injuriesLabel: string;
    equipmentLabel: string;
    goals: {
      fatLoss: string;
      muscleGain: string;
      strength: string;
      recomposition: string;
      endurance: string;
      flexibility: string;
      generalFitness: string;
    };
    places: {
      gym: string;
      home: string;
      both: string;
      outdoor: string;
    };
    experience: {
      beginner: string;
      intermediate: string;
      advanced: string;
    };
    ready: string;
    profileReady: string;
    coachAssigned: string;
    goToWorkout: string;
  };
  errors: {
    generic: string;
    notFound: string;
    unauthorized: string;
    forbidden: string;
    serverError: string;
    networkError: string;
    timeout: string;
    invalidData: string;
    validationError: string;
    fileTooLarge: string;
    unsupportedFormat: string;
    sessionExpired: string;
    rateLimited: string;
    maintenance: string;
  };
  accessibility: {
    skipToMain: string;
    skipToNav: string;
    skipToSearch: string;
    openMenu: string;
    closeMenu: string;
    toggleTheme: string;
    showPassword: string;
    hidePassword: string;
    expandSection: string;
    collapseSection: string;
    loading: string;
    processing: string;
    uploaded: string;
    deleted: string;
    saved: string;
    cancelled: string;
  };
}

export const translations: Record<Locale, Translation> = {
  es: {
    common: {
      app: 'KINETIXFITT',
      loading: 'Cargando...',
      error: 'Error',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      close: 'Cerrar',
      search: 'Buscar',
      filter: 'Filtrar',
      export: 'Exportar',
      import: 'Importar',
      settings: 'Configuración',
      profile: 'Perfil',
      logout: 'Cerrar sesión',
      login: 'Iniciar sesión',
      register: 'Registrarse',
      back: 'Atrás',
      next: 'Siguiente',
      previous: 'Anterior',
      finish: 'Finalizar',
      start: 'Comenzar',
      stop: 'Detener',
      pause: 'Pausar',
      resume: 'Reanudar',
      retry: 'Reintentar',
      refresh: 'Actualizar',
      confirm: 'Confirmar',
      yes: 'Sí',
      no: 'No',
      ok: 'OK',
      success: 'Éxito',
      failed: 'Fallido',
      required: 'Requerido',
      optional: 'Opcional',
      showMore: 'Mostrar más',
      showLess: 'Mostrar menos',
      learnMore: 'Saber más',
      readMore: 'Leer más',
      viewAll: 'Ver todo',
      selectAll: 'Seleccionar todo',
      deselectAll: 'Deseleccionar todo',
      sortBy: 'Ordenar por',
      ascending: 'Ascendente',
      descending: 'Descendente',
      today: 'Hoy',
      yesterday: 'Ayer',
      tomorrow: 'Mañana',
      daysAgo: 'hace {days} días',
      weeksAgo: 'hace {weeks} semanas',
      monthsAgo: 'hace {months} meses',
      yearsAgo: 'hace {years} años',
    },
    nav: {
      features: 'Funciones',
      plans: 'Planes',
      download: 'Descargar',
      menu: 'Menú',
    },
    auth: {
      title: 'KINETIXFITT',
      subtitle: 'Entrenamiento personalizado online',
      emailLabel: 'Email',
      emailPlaceholder: 'tu@email.com',
      passwordLabel: 'Contraseña',
      passwordPlaceholder: '••••••••',
      confirmPasswordLabel: 'Confirmar contraseña',
      confirmPasswordPlaceholder: '••••••••',
      forgotPassword: '¿Olvidaste tu contraseña?',
      createAccount: 'Crear cuenta',
      alreadyHaveAccount: '¿Ya tenés cuenta?',
      dontHaveAccount: '¿No tenés cuenta?',
      signIn: 'Ingresar',
      signUp: 'Registrarse',
      signOut: 'Salir',
      rememberMe: 'Recordarme',
      socialLogin: 'Iniciar sesión con',
      googleLogin: 'Google',
      appleLogin: 'Apple',
      demoTrainer: 'Trainer demo',
      demoClient: 'Cliente demo',
      invalidCredentials: 'Email o contraseña incorrectos',
      connectionError: 'Error de conexión',
      passwordResetSent: 'Te enviamos las instrucciones para resetear tu contraseña',
      passwordResetFailed: 'No se pudo resetear la contraseña',
      weakPassword: 'La contraseña debe tener al menos 8 caracteres',
      passwordMismatch: 'Las contraseñas no coinciden',
      invalidEmail: 'Email inválido',
      accountCreated: 'Cuenta creada exitosamente',
      welcomeBack: 'Bienvenido de nuevo',
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Bienvenido',
      todaysWorkout: 'Entreno de hoy',
      weeklyProgress: 'Progreso semanal',
      adherence: 'Adherencia',
      streak: 'Racha',
      prs: 'PRs',
      upcomingCheckIn: 'Próximo check-in',
      messageCoach: 'Mensaje a tu coach',
      quickActions: 'Acciones rápidas',
      startWorkout: 'Comenzar entreno',
      logMeal: 'Registrar comida',
      trackProgress: 'Seguir progreso',
      viewProgram: 'Ver programa',
      statsTitle: 'Estadísticas',
      workoutsCompleted: 'Entrenos completados',
      totalVolume: 'Volumen total',
      avgIntensity: 'Intensidad promedio',
      caloriesBurned: 'Calorías quemadas',
    },
    workout: {
      title: 'Entrenamiento',
      startWorkout: 'Comenzar entreno',
      finishWorkout: 'Finalizar entreno',
      skipExercise: 'Saltar ejercicio',
      nextExercise: 'Siguiente ejercicio',
      previousExercise: 'Ejercicio anterior',
      restTimer: 'Temporizador de descanso',
      startRest: 'Iniciar descanso',
      skipRest: 'Saltar descanso',
      sets: 'Series',
      reps: 'Repeticiones',
      weight: 'Peso',
      rpe: 'RPE',
      rir: 'RIR',
      notes: 'Notas',
      addSet: 'Agregar serie',
      removeSet: 'Eliminar serie',
      exerciseComplete: 'Ejercicio completado',
      workoutComplete: 'Entrenamiento completado',
      greatJob: '¡Gran trabajo!',
      restTime: 'Tiempo de descanso',
      seconds: 'segundos',
      minutes: 'minutos',
      warmup: 'Calentamiento',
      mainWorkout: 'Entreno principal',
      cooldown: 'Vuelta a la calma',
      superset: 'Superserie',
      dropset: 'Dropset',
      giantSet: 'Serie gigante',
      amrap: 'AMRAP',
      emom: 'EMOM',
      tabata: 'Tabata',
      hiit: 'HIIT',
    },
    nutrition: {
      title: 'Nutrición',
      dailyCalories: 'Calorías diarias',
      targetCalories: 'Objetivo',
      consumed: 'Consumidas',
      remaining: 'Restantes',
      macros: 'Macros',
      protein: 'Proteínas',
      carbs: 'Carbohidratos',
      fats: 'Grasas',
      fiber: 'Fibra',
      water: 'Agua',
      addMeal: 'Agregar comida',
      addFood: 'Agregar alimento',
      scanBarcode: 'Escanear código de barras',
      recentFoods: 'Alimentos recientes',
      favoriteFoods: 'Favoritos',
      mealPlan: 'Plan de comidas',
      breakfast: 'Desayuno',
      lunch: 'Almuerzo',
      dinner: 'Cena',
      snack: 'Snack',
      preworkout: 'Pre-entreno',
      postworkout: 'Post-entreno',
      calorieDeficit: 'Déficit calórico',
      calorieSurplus: 'Superávit calórico',
      maintenance: 'Mantenimiento',
    },
    progress: {
      title: 'Progreso',
      weight: 'Peso',
      measurements: 'Medidas',
      photos: 'Fotos',
      takePhoto: 'Tomar foto',
      uploadPhoto: 'Subir foto',
      beforeAfter: 'Antes/Después',
      compare: 'Comparar',
      timeline: 'Línea de tiempo',
      addEntry: 'Agregar entrada',
      viewHistory: 'Ver historial',
      currentWeight: 'Peso actual',
      startingWeight: 'Peso inicial',
      goalWeight: 'Peso objetivo',
      weightChange: 'Cambio de peso',
      bodyFat: 'Grasa corporal',
      muscleMass: 'Masa muscular',
      bmi: 'IMC',
      waist: 'Cintura',
      hips: 'Caderas',
      chest: 'Pecho',
      arms: 'Brazos',
      legs: 'Piernas',
      neck: 'Cuello',
    },
    messages: {
      title: 'Mensajes',
      sendMessage: 'Enviar mensaje',
      typeMessage: 'Escribe un mensaje...',
      send: 'Enviar',
      coachResponse: 'Respuesta del coach',
      waitingResponse: 'Esperando respuesta',
      newMessage: 'Nuevo mensaje',
      markAsRead: 'Marcar como leído',
      archive: 'Archivar',
      delete: 'Eliminar',
      attachment: 'Adjunto',
      voiceMessage: 'Mensaje de voz',
      typing: 'Escribiendo...',
      online: 'En línea',
      offline: 'Sin conexión',
      lastSeen: 'Visto por última vez',
    },
    timers: {
      title: 'Temporizadores',
      stopwatch: 'Cronómetro',
      countdown: 'Cuenta regresiva',
      hiit: 'HIIT',
      tabata: 'Tabata',
      emom: 'EMOM',
      amrap: 'AMRAP',
      custom: 'Personalizado',
      start: 'Iniciar',
      pause: 'Pausar',
      reset: 'Resetear',
      laps: 'Vueltas',
      lap: 'Vuelta',
      totalTime: 'Tiempo total',
      avgLap: 'Vuelta promedio',
      bestLap: 'Mejor vuelta',
      workInterval: 'Intervalo de trabajo',
      restInterval: 'Intervalo de descanso',
      rounds: 'Rondas',
      prepare: 'Preparar',
      getReady: 'Listo',
      rest: 'Descanso',
      work: 'Trabajo',
      finished: 'Finalizado',
    },
    achievements: {
      title: 'Logros',
      unlocked: 'Desbloqueado',
      locked: 'Bloqueado',
      progress: 'Progreso',
      claim: 'Reclamar',
      claimed: 'Reclamado',
      totalPoints: 'Puntos totales',
      level: 'Nivel',
      xp: 'XP',
      nextLevel: 'Siguiente nivel',
      badges: 'Insignias',
      trophies: 'Trofeos',
      milestones: 'Hitos',
      challenges: 'Desafíos',
      dailyChallenge: 'Desafío diario',
      weeklyChallenge: 'Desafío semanal',
      monthlyChallenge: 'Desafío mensual',
      completed: 'Completado',
      inProgress: 'En progreso',
      reward: 'Recompensa',
    },
    settings: {
      title: 'Configuración',
      general: 'General',
      notifications: 'Notificaciones',
      privacy: 'Privacidad',
      language: 'Idioma',
      theme: 'Tema',
      darkMode: 'Modo oscuro',
      lightMode: 'Modo claro',
      systemTheme: 'Tema del sistema',
      units: 'Unidades',
      metric: 'Métrico',
      imperial: 'Imperial',
      firstDayOfWeek: 'Primer día de la semana',
      timeFormat: 'Formato de hora',
      dateFormat: 'Formato de fecha',
      timezone: 'Zona horaria',
      dataExport: 'Exportar datos',
      deleteAccount: 'Eliminar cuenta',
      changePassword: 'Cambiar contraseña',
      twoFactorAuth: 'Autenticación de dos factores',
      connectedApps: 'Apps conectadas',
      billing: 'Facturación',
      subscription: 'Suscripción',
      paymentMethod: 'Método de pago',
      invoices: 'Facturas',
      cancelSubscription: 'Cancelar suscripción',
    },
    onboarding: {
      welcome: 'Bienvenido a KINETIXFITT',
      step1: 'Paso 1/5',
      step2: 'Paso 2/5',
      step3: 'Paso 3/5',
      step4: 'Paso 4/5',
      step5: 'Paso 5/5',
      goalLabel: '¿Cuál es tu objetivo?',
      daysLabel: '¿Cuántos días podés entrenar?',
      placeLabel: '¿Dónde entrenás?',
      experienceLabel: '¿Cuál es tu experiencia?',
      injuriesLabel: '¿Tenés alguna lesión?',
      equipmentLabel: '¿Qué equipo tenés disponible?',
      goals: {
        fatLoss: 'Pérdida de grasa',
        muscleGain: 'Ganancia muscular',
        strength: 'Fuerza',
        recomposition: 'Recomposición',
        endurance: 'Resistencia',
        flexibility: 'Flexibilidad',
        generalFitness: 'Fitness general',
      },
      places: {
        gym: 'Gimnasio',
        home: 'Casa',
        both: 'Ambos',
        outdoor: 'Aire libre',
      },
      experience: {
        beginner: 'Principiante',
        intermediate: 'Intermedio',
        advanced: 'Avanzado',
      },
      ready: '¡Listo!',
      profileReady: '¡Tu perfil está listo!',
      coachAssigned: 'Tu coach te asignará tu primer programa',
      goToWorkout: 'Ir a mi entreno',
    },
    errors: {
      generic: 'Algo salió mal. Por favor intentá de nuevo.',
      notFound: 'Página no encontrada',
      unauthorized: 'No autorizado. Por favor iniciá sesión.',
      forbidden: 'Acceso denegado',
      serverError: 'Error del servidor. Intentá más tarde.',
      networkError: 'Error de red. Verificá tu conexión.',
      timeout: 'La solicitud tardó demasiado',
      invalidData: 'Datos inválidos',
      validationError: 'Error de validación',
      fileTooLarge: 'Archivo demasiado grande',
      unsupportedFormat: 'Formato no soportado',
      sessionExpired: 'Sesión expirada. Por favor volvé a iniciar sesión.',
      rateLimited: 'Demasiadas solicitudes. Esperá un momento.',
      maintenance: 'Estamos en mantenimiento. Volvé más tarde.',
    },
    accessibility: {
      skipToMain: 'Saltar al contenido principal',
      skipToNav: 'Saltar a la navegación',
      skipToSearch: 'Saltar a la búsqueda',
      openMenu: 'Abrir menú',
      closeMenu: 'Cerrar menú',
      toggleTheme: 'Cambiar tema',
      showPassword: 'Mostrar contraseña',
      hidePassword: 'Ocultar contraseña',
      expandSection: 'Expandir sección',
      collapseSection: 'Colapsar sección',
      loading: 'Cargando',
      processing: 'Procesando',
      uploaded: 'Subido',
      deleted: 'Eliminado',
      saved: 'Guardado',
      cancelled: 'Cancelado',
    },
  },
  en: {
    common: {
      app: 'KINETIXFITT',
      loading: 'Loading...',
      error: 'Error',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      settings: 'Settings',
      profile: 'Profile',
      logout: 'Logout',
      login: 'Login',
      register: 'Register',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      finish: 'Finish',
      start: 'Start',
      stop: 'Stop',
      pause: 'Pause',
      resume: 'Resume',
      retry: 'Retry',
      refresh: 'Refresh',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      success: 'Success',
      failed: 'Failed',
      required: 'Required',
      optional: 'Optional',
      showMore: 'Show more',
      showLess: 'Show less',
      learnMore: 'Learn more',
      readMore: 'Read more',
      viewAll: 'View all',
      selectAll: 'Select all',
      deselectAll: 'Deselect all',
      sortBy: 'Sort by',
      ascending: 'Ascending',
      descending: 'Descending',
      today: 'Today',
      yesterday: 'Yesterday',
      tomorrow: 'Tomorrow',
      daysAgo: '{days} days ago',
      weeksAgo: '{weeks} weeks ago',
      monthsAgo: '{months} months ago',
      yearsAgo: '{years} years ago',
    },
    nav: {
      features: 'Features',
      plans: 'Plans',
      download: 'Download',
      menu: 'Menu',
    },
    auth: {
      title: 'KINETIXFITT',
      subtitle: 'Personalized online training',
      emailLabel: 'Email',
      emailPlaceholder: 'your@email.com',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      confirmPasswordLabel: 'Confirm password',
      confirmPasswordPlaceholder: '••••••••',
      forgotPassword: 'Forgot your password?',
      createAccount: 'Create account',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
      signIn: 'Sign in',
      signUp: 'Sign up',
      signOut: 'Sign out',
      rememberMe: 'Remember me',
      socialLogin: 'Sign in with',
      googleLogin: 'Google',
      appleLogin: 'Apple',
      demoTrainer: 'Demo Trainer',
      demoClient: 'Demo Client',
      invalidCredentials: 'Invalid email or password',
      connectionError: 'Connection error',
      passwordResetSent: 'Password reset instructions sent',
      passwordResetFailed: 'Could not reset password',
      weakPassword: 'Password must be at least 8 characters',
      passwordMismatch: 'Passwords do not match',
      invalidEmail: 'Invalid email',
      accountCreated: 'Account created successfully',
      welcomeBack: 'Welcome back',
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome',
      todaysWorkout: "Today's Workout",
      weeklyProgress: 'Weekly Progress',
      adherence: 'Adherence',
      streak: 'Streak',
      prs: 'PRs',
      upcomingCheckIn: 'Upcoming Check-in',
      messageCoach: 'Message Coach',
      quickActions: 'Quick Actions',
      startWorkout: 'Start Workout',
      logMeal: 'Log Meal',
      trackProgress: 'Track Progress',
      viewProgram: 'View Program',
      statsTitle: 'Statistics',
      workoutsCompleted: 'Workouts Completed',
      totalVolume: 'Total Volume',
      avgIntensity: 'Avg Intensity',
      caloriesBurned: 'Calories Burned',
    },
    workout: {
      title: 'Workout',
      startWorkout: 'Start Workout',
      finishWorkout: 'Finish Workout',
      skipExercise: 'Skip Exercise',
      nextExercise: 'Next Exercise',
      previousExercise: 'Previous Exercise',
      restTimer: 'Rest Timer',
      startRest: 'Start Rest',
      skipRest: 'Skip Rest',
      sets: 'Sets',
      reps: 'Reps',
      weight: 'Weight',
      rpe: 'RPE',
      rir: 'RIR',
      notes: 'Notes',
      addSet: 'Add Set',
      removeSet: 'Remove Set',
      exerciseComplete: 'Exercise Complete',
      workoutComplete: 'Workout Complete',
      greatJob: 'Great Job!',
      restTime: 'Rest Time',
      seconds: 'seconds',
      minutes: 'minutes',
      warmup: 'Warmup',
      mainWorkout: 'Main Workout',
      cooldown: 'Cooldown',
      superset: 'Superset',
      dropset: 'Dropset',
      giantSet: 'Giant Set',
      amrap: 'AMRAP',
      emom: 'EMOM',
      tabata: 'Tabata',
      hiit: 'HIIT',
    },
    nutrition: {
      title: 'Nutrition',
      dailyCalories: 'Daily Calories',
      targetCalories: 'Target',
      consumed: 'Consumed',
      remaining: 'Remaining',
      macros: 'Macros',
      protein: 'Protein',
      carbs: 'Carbs',
      fats: 'Fats',
      fiber: 'Fiber',
      water: 'Water',
      addMeal: 'Add Meal',
      addFood: 'Add Food',
      scanBarcode: 'Scan Barcode',
      recentFoods: 'Recent Foods',
      favoriteFoods: 'Favorites',
      mealPlan: 'Meal Plan',
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snack',
      preworkout: 'Pre-workout',
      postworkout: 'Post-workout',
      calorieDeficit: 'Calorie Deficit',
      calorieSurplus: 'Calorie Surplus',
      maintenance: 'Maintenance',
    },
    progress: {
      title: 'Progress',
      weight: 'Weight',
      measurements: 'Measurements',
      photos: 'Photos',
      takePhoto: 'Take Photo',
      uploadPhoto: 'Upload Photo',
      beforeAfter: 'Before/After',
      compare: 'Compare',
      timeline: 'Timeline',
      addEntry: 'Add Entry',
      viewHistory: 'View History',
      currentWeight: 'Current Weight',
      startingWeight: 'Starting Weight',
      goalWeight: 'Goal Weight',
      weightChange: 'Weight Change',
      bodyFat: 'Body Fat',
      muscleMass: 'Muscle Mass',
      bmi: 'BMI',
      waist: 'Waist',
      hips: 'Hips',
      chest: 'Chest',
      arms: 'Arms',
      legs: 'Legs',
      neck: 'Neck',
    },
    messages: {
      title: 'Messages',
      sendMessage: 'Send Message',
      typeMessage: 'Type a message...',
      send: 'Send',
      coachResponse: 'Coach Response',
      waitingResponse: 'Waiting for response',
      newMessage: 'New Message',
      markAsRead: 'Mark as Read',
      archive: 'Archive',
      delete: 'Delete',
      attachment: 'Attachment',
      voiceMessage: 'Voice Message',
      typing: 'Typing...',
      online: 'Online',
      offline: 'Offline',
      lastSeen: 'Last seen',
    },
    timers: {
      title: 'Timers',
      stopwatch: 'Stopwatch',
      countdown: 'Countdown',
      hiit: 'HIIT',
      tabata: 'Tabata',
      emom: 'EMOM',
      amrap: 'AMRAP',
      custom: 'Custom',
      start: 'Start',
      pause: 'Pause',
      reset: 'Reset',
      laps: 'Laps',
      lap: 'Lap',
      totalTime: 'Total Time',
      avgLap: 'Avg Lap',
      bestLap: 'Best Lap',
      workInterval: 'Work Interval',
      restInterval: 'Rest Interval',
      rounds: 'Rounds',
      prepare: 'Prepare',
      getReady: 'Get Ready',
      rest: 'Rest',
      work: 'Work',
      finished: 'Finished',
    },
    achievements: {
      title: 'Achievements',
      unlocked: 'Unlocked',
      locked: 'Locked',
      progress: 'Progress',
      claim: 'Claim',
      claimed: 'Claimed',
      totalPoints: 'Total Points',
      level: 'Level',
      xp: 'XP',
      nextLevel: 'Next Level',
      badges: 'Badges',
      trophies: 'Trophies',
      milestones: 'Milestones',
      challenges: 'Challenges',
      dailyChallenge: 'Daily Challenge',
      weeklyChallenge: 'Weekly Challenge',
      monthlyChallenge: 'Monthly Challenge',
      completed: 'Completed',
      inProgress: 'In Progress',
      reward: 'Reward',
    },
    settings: {
      title: 'Settings',
      general: 'General',
      notifications: 'Notifications',
      privacy: 'Privacy',
      language: 'Language',
      theme: 'Theme',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      systemTheme: 'System Theme',
      units: 'Units',
      metric: 'Metric',
      imperial: 'Imperial',
      firstDayOfWeek: 'First day of week',
      timeFormat: 'Time format',
      dateFormat: 'Date format',
      timezone: 'Timezone',
      dataExport: 'Export Data',
      deleteAccount: 'Delete Account',
      changePassword: 'Change Password',
      twoFactorAuth: 'Two-Factor Authentication',
      connectedApps: 'Connected Apps',
      billing: 'Billing',
      subscription: 'Subscription',
      paymentMethod: 'Payment Method',
      invoices: 'Invoices',
      cancelSubscription: 'Cancel Subscription',
    },
    onboarding: {
      welcome: 'Welcome to KINETIXFITT',
      step1: 'Step 1/5',
      step2: 'Step 2/5',
      step3: 'Step 3/5',
      step4: 'Step 4/5',
      step5: 'Step 5/5',
      goalLabel: "What's your goal?",
      daysLabel: 'How many days can you train?',
      placeLabel: 'Where do you train?',
      experienceLabel: "What's your experience level?",
      injuriesLabel: 'Do you have any injuries?',
      equipmentLabel: 'What equipment do you have?',
      goals: {
        fatLoss: 'Fat Loss',
        muscleGain: 'Muscle Gain',
        strength: 'Strength',
        recomposition: 'Recomposition',
        endurance: 'Endurance',
        flexibility: 'Flexibility',
        generalFitness: 'General Fitness',
      },
      places: {
        gym: 'Gym',
        home: 'Home',
        both: 'Both',
        outdoor: 'Outdoor',
      },
      experience: {
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
      },
      ready: "You're Ready!",
      profileReady: 'Your profile is ready!',
      coachAssigned: 'Your coach will assign your first program',
      goToWorkout: 'Go to My Workout',
    },
    errors: {
      generic: 'Something went wrong. Please try again.',
      notFound: 'Page not found',
      unauthorized: 'Unauthorized. Please log in.',
      forbidden: 'Access denied',
      serverError: 'Server error. Try again later.',
      networkError: 'Network error. Check your connection.',
      timeout: 'Request timed out',
      invalidData: 'Invalid data',
      validationError: 'Validation error',
      fileTooLarge: 'File too large',
      unsupportedFormat: 'Unsupported format',
      sessionExpired: 'Session expired. Please log in again.',
      rateLimited: 'Too many requests. Please wait.',
      maintenance: "We're under maintenance. Come back later.",
    },
    accessibility: {
      skipToMain: 'Skip to main content',
      skipToNav: 'Skip to navigation',
      skipToSearch: 'Skip to search',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      toggleTheme: 'Toggle theme',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      expandSection: 'Expand section',
      collapseSection: 'Collapse section',
      loading: 'Loading',
      processing: 'Processing',
      uploaded: 'Uploaded',
      deleted: 'Deleted',
      saved: 'Saved',
      cancelled: 'Cancelled',
    },
  },
  pt: {
    common: {
      app: 'KINETIXFITT',
      loading: 'Carregando...',
      error: 'Erro',
      save: 'Salvar',
      cancel: 'Cancelar',
      delete: 'Excluir',
      edit: 'Editar',
      close: 'Fechar',
      search: 'Buscar',
      filter: 'Filtrar',
      export: 'Exportar',
      import: 'Importar',
      settings: 'Configurações',
      profile: 'Perfil',
      logout: 'Sair',
      login: 'Entrar',
      register: 'Registrar',
      back: 'Voltar',
      next: 'Próximo',
      previous: 'Anterior',
      finish: 'Finalizar',
      start: 'Começar',
      stop: 'Parar',
      pause: 'Pausar',
      resume: 'Retomar',
      retry: 'Tentar novamente',
      refresh: 'Atualizar',
      confirm: 'Confirmar',
      yes: 'Sim',
      no: 'Não',
      ok: 'OK',
      success: 'Sucesso',
      failed: 'Falhou',
      required: 'Obrigatório',
      optional: 'Opcional',
      showMore: 'Mostrar mais',
      showLess: 'Mostrar menos',
      learnMore: 'Saiba mais',
      readMore: 'Ler mais',
      viewAll: 'Ver tudo',
      selectAll: 'Selecionar tudo',
      deselectAll: 'Desmarcar tudo',
      sortBy: 'Ordenar por',
      ascending: 'Ascendente',
      descending: 'Descendente',
      today: 'Hoje',
      yesterday: 'Ontem',
      tomorrow: 'Amanhã',
      daysAgo: 'há {days} dias',
      weeksAgo: 'há {weeks} semanas',
      monthsAgo: 'há {months} meses',
      yearsAgo: 'há {years} anos',
    },
    nav: {
      features: 'Recursos',
      plans: 'Planos',
      download: 'Baixar',
      menu: 'Menu',
    },
    auth: {
      title: 'KINETIXFITT',
      subtitle: 'Treinamento personalizado online',
      emailLabel: 'Email',
      emailPlaceholder: 'seu@email.com',
      passwordLabel: 'Senha',
      passwordPlaceholder: '••••••••',
      confirmPasswordLabel: 'Confirmar senha',
      confirmPasswordPlaceholder: '••••••••',
      forgotPassword: 'Esqueceu sua senha?',
      createAccount: 'Criar conta',
      alreadyHaveAccount: 'Já tem uma conta?',
      dontHaveAccount: 'Não tem uma conta?',
      signIn: 'Entrar',
      signUp: 'Registrar',
      signOut: 'Sair',
      rememberMe: 'Lembrar-me',
      socialLogin: 'Entrar com',
      googleLogin: 'Google',
      appleLogin: 'Apple',
      demoTrainer: 'Treinador demo',
      demoClient: 'Cliente demo',
      invalidCredentials: 'Email ou senha inválidos',
      connectionError: 'Erro de conexão',
      passwordResetSent: 'Instruções de redefinição enviadas',
      passwordResetFailed: 'Não foi possível redefinir a senha',
      weakPassword: 'A senha deve ter pelo menos 8 caracteres',
      passwordMismatch: 'As senhas não coincidem',
      invalidEmail: 'Email inválido',
      accountCreated: 'Conta criada com sucesso',
      welcomeBack: 'Bem-vindo de volta',
    },
    dashboard: {
      title: 'Painel',
      welcome: 'Bem-vindo',
      todaysWorkout: 'Treino de hoje',
      weeklyProgress: 'Progresso semanal',
      adherence: 'Adesão',
      streak: 'Sequência',
      prs: 'Recordes',
      upcomingCheckIn: 'Próximo check-in',
      messageCoach: 'Mensagem ao coach',
      quickActions: 'Ações rápidas',
      startWorkout: 'Começar treino',
      logMeal: 'Registrar refeição',
      trackProgress: 'Acompanhar progresso',
      viewProgram: 'Ver programa',
      statsTitle: 'Estatísticas',
      workoutsCompleted: 'Treinos completados',
      totalVolume: 'Volume total',
      avgIntensity: 'Intensidade média',
      caloriesBurned: 'Calorias queimadas',
    },
    workout: {
      title: 'Treino',
      startWorkout: 'Começar treino',
      finishWorkout: 'Finalizar treino',
      skipExercise: 'Pular exercício',
      nextExercise: 'Próximo exercício',
      previousExercise: 'Exercício anterior',
      restTimer: 'Temporizador de descanso',
      startRest: 'Iniciar descanso',
      skipRest: 'Pular descanso',
      sets: 'Séries',
      reps: 'Repetições',
      weight: 'Peso',
      rpe: 'RPE',
      rir: 'RIR',
      notes: 'Notas',
      addSet: 'Adicionar série',
      removeSet: 'Remover série',
      exerciseComplete: 'Exercício completo',
      workoutComplete: 'Treino completo',
      greatJob: 'Ótimo trabalho!',
      restTime: 'Tempo de descanso',
      seconds: 'segundos',
      minutes: 'minutos',
      warmup: 'Aquecimento',
      mainWorkout: 'Treino principal',
      cooldown: 'Volta à calma',
      superset: 'Supersérie',
      dropset: 'Dropset',
      giantSet: 'Série gigante',
      amrap: 'AMRAP',
      emom: 'EMOM',
      tabata: 'Tabata',
      hiit: 'HIIT',
    },
    nutrition: {
      title: 'Nutrição',
      dailyCalories: 'Calorias diárias',
      targetCalories: 'Meta',
      consumed: 'Consumidas',
      remaining: 'Restantes',
      macros: 'Macros',
      protein: 'Proteínas',
      carbs: 'Carboidratos',
      fats: 'Gorduras',
      fiber: 'Fibras',
      water: 'Água',
      addMeal: 'Adicionar refeição',
      addFood: 'Adicionar alimento',
      scanBarcode: 'Escanear código de barras',
      recentFoods: 'Alimentos recentes',
      favoriteFoods: 'Favoritos',
      mealPlan: 'Plano alimentar',
      breakfast: 'Café da manhã',
      lunch: 'Almoço',
      dinner: 'Jantar',
      snack: 'Lanche',
      preworkout: 'Pré-treino',
      postworkout: 'Pós-treino',
      calorieDeficit: 'Déficit calórico',
      calorieSurplus: 'Superávit calórico',
      maintenance: 'Manutenção',
    },
    progress: {
      title: 'Progresso',
      weight: 'Peso',
      measurements: 'Medidas',
      photos: 'Fotos',
      takePhoto: 'Tirar foto',
      uploadPhoto: 'Enviar foto',
      beforeAfter: 'Antes/Depois',
      compare: 'Comparar',
      timeline: 'Linha do tempo',
      addEntry: 'Adicionar entrada',
      viewHistory: 'Ver histórico',
      currentWeight: 'Peso atual',
      startingWeight: 'Peso inicial',
      goalWeight: 'Peso objetivo',
      weightChange: 'Mudança de peso',
      bodyFat: 'Gordura corporal',
      muscleMass: 'Massa muscular',
      bmi: 'IMC',
      waist: 'Cintura',
      hips: 'Quadril',
      chest: 'Peito',
      arms: 'Braços',
      legs: 'Pernas',
      neck: 'Pescoço',
    },
    messages: {
      title: 'Mensagens',
      sendMessage: 'Enviar mensagem',
      typeMessage: 'Digite uma mensagem...',
      send: 'Enviar',
      coachResponse: 'Resposta do coach',
      waitingResponse: 'Aguardando resposta',
      newMessage: 'Nova mensagem',
      markAsRead: 'Marcar como lida',
      archive: 'Arquivar',
      delete: 'Excluir',
      attachment: 'Anexo',
      voiceMessage: 'Mensagem de voz',
      typing: 'Digitando...',
      online: 'Online',
      offline: 'Offline',
      lastSeen: 'Visto por último',
    },
    timers: {
      title: 'Temporizadores',
      stopwatch: 'Cronômetro',
      countdown: 'Contagem regressiva',
      hiit: 'HIIT',
      tabata: 'Tabata',
      emom: 'EMOM',
      amrap: 'AMRAP',
      custom: 'Personalizado',
      start: 'Iniciar',
      pause: 'Pausar',
      reset: 'Resetar',
      laps: 'Voltas',
      lap: 'Volta',
      totalTime: 'Tempo total',
      avgLap: 'Volta média',
      bestLap: 'Melhor volta',
      workInterval: 'Intervalo de trabalho',
      restInterval: 'Intervalo de descanso',
      rounds: 'Rodadas',
      prepare: 'Preparar',
      getReady: 'Pronto',
      rest: 'Descanso',
      work: 'Trabalho',
      finished: 'Finalizado',
    },
    achievements: {
      title: 'Conquistas',
      unlocked: 'Desbloqueado',
      locked: 'Bloqueado',
      progress: 'Progresso',
      claim: 'Reivindicar',
      claimed: 'Reivindicado',
      totalPoints: 'Pontos totais',
      level: 'Nível',
      xp: 'XP',
      nextLevel: 'Próximo nível',
      badges: 'Distintivos',
      trophies: 'Troféus',
      milestones: 'Marcos',
      challenges: 'Desafios',
      dailyChallenge: 'Desafio diário',
      weeklyChallenge: 'Desafio semanal',
      monthlyChallenge: 'Desafio mensal',
      completed: 'Completo',
      inProgress: 'Em progresso',
      reward: 'Recompensa',
    },
    settings: {
      title: 'Configurações',
      general: 'Geral',
      notifications: 'Notificações',
      privacy: 'Privacidade',
      language: 'Idioma',
      theme: 'Tema',
      darkMode: 'Modo escuro',
      lightMode: 'Modo claro',
      systemTheme: 'Tema do sistema',
      units: 'Unidades',
      metric: 'Métrico',
      imperial: 'Imperial',
      firstDayOfWeek: 'Primeiro dia da semana',
      timeFormat: 'Formato de hora',
      dateFormat: 'Formato de data',
      timezone: 'Fuso horário',
      dataExport: 'Exportar dados',
      deleteAccount: 'Excluir conta',
      changePassword: 'Alterar senha',
      twoFactorAuth: 'Autenticação de dois fatores',
      connectedApps: 'Apps conectados',
      billing: 'Faturamento',
      subscription: 'Assinatura',
      paymentMethod: 'Método de pagamento',
      invoices: 'Faturas',
      cancelSubscription: 'Cancelar assinatura',
    },
    onboarding: {
      welcome: 'Bem-vindo ao KINETIXFITT',
      step1: 'Passo 1/5',
      step2: 'Passo 2/5',
      step3: 'Passo 3/5',
      step4: 'Passo 4/5',
      step5: 'Passo 5/5',
      goalLabel: 'Qual é seu objetivo?',
      daysLabel: 'Quantos dias você pode treinar?',
      placeLabel: 'Onde você treina?',
      experienceLabel: 'Qual seu nível de experiência?',
      injuriesLabel: 'Você tem alguma lesão?',
      equipmentLabel: 'Que equipamento você tem?',
      goals: {
        fatLoss: 'Perda de gordura',
        muscleGain: 'Ganho muscular',
        strength: 'Força',
        recomposition: 'Recomposição',
        endurance: 'Resistência',
        flexibility: 'Flexibilidade',
        generalFitness: 'Condicionamento geral',
      },
      places: {
        gym: 'Academia',
        home: 'Casa',
        both: 'Ambos',
        outdoor: 'Ao ar livre',
      },
      experience: {
        beginner: 'Iniciante',
        intermediate: 'Intermediário',
        advanced: 'Avançado',
      },
      ready: 'Você está pronto!',
      profileReady: 'Seu perfil está pronto!',
      coachAssigned: 'Tu coach atribuirá seu primeiro programa',
      goToWorkout: 'Ir para meu treino',
    },
    errors: {
      generic: 'Algo deu errado. Por favor tente novamente.',
      notFound: 'Página não encontrada',
      unauthorized: 'Não autorizado. Por favor faça login.',
      forbidden: 'Acesso negado',
      serverError: 'Erro do servidor. Tente mais tarde.',
      networkError: 'Erro de rede. Verifique sua conexão.',
      timeout: 'A solicitação expirou',
      invalidData: 'Dados inválidos',
      validationError: 'Erro de validação',
      fileTooLarge: 'Arquivo muito grande',
      unsupportedFormat: 'Formato não suportado',
      sessionExpired: 'Sessão expirada. Por favor faça login novamente.',
      rateLimited: 'Muitas solicitações. Por favor aguarde.',
      maintenance: 'Estamos em manutenção. Volte mais tarde.',
    },
    accessibility: {
      skipToMain: 'Pular para o conteúdo principal',
      skipToNav: 'Pular para navegação',
      skipToSearch: 'Pular para busca',
      openMenu: 'Abrir menu',
      closeMenu: 'Fechar menu',
      toggleTheme: 'Alternar tema',
      showPassword: 'Mostrar senha',
      hidePassword: 'Ocultar senha',
      expandSection: 'Expandir seção',
      collapseSection: 'Colapsar seção',
      loading: 'Carregando',
      processing: 'Processando',
      uploaded: 'Enviado',
      deleted: 'Excluído',
      saved: 'Salvo',
      cancelled: 'Cancelado',
    },
  },
};

export const defaultLocale: Locale = 'es';

export function getTranslation(locale: Locale = defaultLocale): Translation {
  return translations[locale] || translations.es;
}

export function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : `{${key}}`;
  });
}
