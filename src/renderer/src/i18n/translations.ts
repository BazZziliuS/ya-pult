import type { Lang } from '@shared/types'

export type { Lang }

export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' }
]

const ru = {
  app: {
    title: 'ЯПульт',
    subtitle: 'пульт умного дома'
  },
  topbar: {
    connected: 'Подключено',
    connectionIssue: 'Проблемы со связью',
    connectionIssueTooltip: 'Проблемы со связью с api.iot.yandex.net',
    connectionOkTooltip: 'Всё в порядке',
    notAuthed: 'Не авторизован',
    refresh: 'Обновить',
    refreshing: 'Обновляем…',
    updatedAt: 'Обновлено: {{time}}',
    login: 'Войти через Яндекс',
    logout: 'Выйти',
    account: 'Аккаунт',
    language: 'Язык',
    settings: 'Настройки'
  },
  settings: {
    title: 'Настройки',
    language: 'Язык интерфейса',
    notifications: 'Системные уведомления',
    notificationsHint: 'Показывать уведомления ОС о потере сессии, долгой недоступности и завершении сценариев',
    pollInterval: 'Частота опроса устройств',
    seconds: 'сек',
    close: 'Готово'
  },
  login: {
    title: 'Умный дом Яндекса',
    subtitle: 'Войдите через Яндекс ID, чтобы увидеть свои комнаты, устройства и сценарии.',
    cta: 'Войти через Яндекс',
    notCompleted: 'Авторизация не завершена. Попробуйте ещё раз.'
  },
  home: {
    scenarios: 'Сценарии',
    unassignedRoom: 'Без комнаты',
    emptyTitle: 'В вашем доме Яндекса пока нет комнат, устройств или сценариев.',
    loadingTitle: 'Загружаем ваш дом…'
  },
  sidebar: {
    rooms: 'Комнаты',
    groups: 'Группы',
    sensors: 'Датчики',
    scenarios: 'Сценарии',
    emptyRoom: 'В этой комнате пока нет устройств',
    household: 'Дом'
  },
  search: {
    placeholder: 'Поиск устройства или сценария…',
    devices: 'Устройства',
    noResults: 'Ничего не найдено'
  },
  groups: {
    title: 'Группы устройств',
    badge: 'Группа',
    deviceCount: '{{count}} {{word}}',
    deviceWordOne: 'устройство',
    deviceWordFew: 'устройства',
    deviceWordMany: 'устройств'
  },
  device: {
    offline: 'Не в сети',
    unsupported: 'Управление этим устройством пока не поддерживается',
    noResponse: 'Устройство не ответило',
    power: 'Питание',
    lightTemperature: 'Температура света',
    color: 'Цвет',
    warm: 'Тёплый белый',
    cool: 'Холодный белый',
    manufacturerModel: '{{manufacturer}} · {{model}}'
  },
  toast: {
    connectionRestored: 'Соединение восстановлено',
    longNoConnection: 'Долго нет связи с сервером умного дома',
    scenarioLaunched: 'Сценарий «{{name}}» запущен',
    scenarioError: 'Сценарий «{{name}}»: {{message}}',
    scenarioInactive: 'Сценарий «{{name}}» отключён — включите его в приложении «Дом с Алисой»'
  },
  notify: {
    connectionLostTitle: 'ЯПульт — нет связи',
    scenarioDoneTitle: 'ЯПульт',
    scenarioDoneBody: 'Сценарий «{{name}}» выполнен'
  },
  update: {
    available: 'Доступна новая версия {{version}}',
    open: 'Открыть'
  },
  error: {
    retry: 'Повторить попытку',
    retryShort: 'Повторить',
    reload: 'Перезагрузить',
    somethingWrong: 'Что-то пошло не так',
    kindTitle: {
      auth: 'Требуется вход',
      network: 'Нет соединения',
      timeout: 'Сервер не отвечает',
      api: 'Ошибка сервера',
      scenarioInactive: 'Сценарий отключён',
      unknown: 'Не удалось загрузить дом'
    }
  },
  deviceType: {
    'devices.types.light': 'Освещение',
    'devices.types.socket': 'Розетка',
    'devices.types.switch': 'Выключатель',
    'devices.types.thermostat': 'Термостат',
    'devices.types.thermostat.ac': 'Кондиционер',
    'devices.types.vacuum_cleaner': 'Пылесос',
    'devices.types.humidifier': 'Увлажнитель',
    'devices.types.purifier': 'Очиститель воздуха',
    'devices.types.pump': 'Насос',
    'devices.types.pump.well': 'Насос',
    'devices.types.washing_machine': 'Стиральная машина',
    'devices.types.dishwasher': 'Посудомоечная машина',
    'devices.types.kettle': 'Чайник',
    'devices.types.multicooker': 'Мультиварка',
    'devices.types.cooking': 'Кухонная техника',
    'devices.types.cooking.coffee_maker': 'Кофеварка',
    'devices.types.pet_feeder': 'Кормушка',
    'devices.types.pet_drinking_fountain': 'Поилка',
    'devices.types.camera': 'Камера',
    'devices.types.smart_lock': 'Умный замок',
    'devices.types.media_device': 'Медиаустройство',
    'devices.types.media_device.tv': 'Телевизор',
    'devices.types.media_device.tv_box': 'ТВ-приставка',
    'devices.types.media_device.receiver': 'Ресивер',
    'devices.types.openable': 'Открывающееся устройство',
    'devices.types.openable.curtain': 'Шторы',
    'devices.types.openable.valve': 'Клапан',
    'devices.types.sensor': 'Датчик',
    'devices.types.sensor.button': 'Кнопка',
    'devices.types.sensor.climate': 'Датчик климата',
    'devices.types.sensor.gas': 'Датчик газа',
    'devices.types.sensor.illumination': 'Датчик освещённости',
    'devices.types.sensor.motion': 'Датчик движения',
    'devices.types.sensor.open': 'Датчик открытия',
    'devices.types.sensor.smoke': 'Датчик дыма',
    'devices.types.sensor.vibration': 'Датчик вибрации',
    'devices.types.sensor.water_leak': 'Датчик протечки',
    'devices.types.other': 'Устройство',
    fallback: 'Устройство'
  },
  rangeInstance: {
    brightness: 'Яркость',
    temperature: 'Температура',
    volume: 'Громкость',
    channel: 'Канал',
    humidity: 'Влажность'
  },
  modeInstance: {
    program: 'Программа',
    fan_speed: 'Скорость вентилятора',
    thermostat: 'Режим',
    swing: 'Направление обдува',
    work_speed: 'Скорость работы'
  },
  toggleInstance: {
    backlight: 'Подсветка',
    controls_locked: 'Блокировка кнопок',
    mute: 'Без звука',
    pause: 'Пауза'
  },
  propertyInstance: {
    temperature: 'Температура',
    humidity: 'Влажность',
    co2_level: 'Уровень CO₂',
    'pm2.5_density': 'PM2.5',
    pm10_density: 'PM10',
    water_level: 'Уровень воды',
    battery_level: 'Заряд батареи',
    pressure: 'Давление',
    illumination: 'Освещённость',
    water_leak: 'Протечка',
    motion: 'Движение',
    smoke: 'Дым',
    gas: 'Газ',
    button: 'Кнопка',
    vibration: 'Вибрация',
    open: 'Открытие',
    fallback: ''
  },
  colorName: {
    warmWhite: 'Тёплый белый',
    coolWhite: 'Холодный белый',
    red: 'Красный',
    orange: 'Оранжевый',
    yellow: 'Жёлтый',
    green: 'Зелёный',
    cyan: 'Голубой',
    blue: 'Синий',
    purple: 'Фиолетовый',
    pink: 'Розовый'
  },
  unit: {
    mmHg: 'мм рт. ст.',
    lux: 'лк'
  }
}

const en = {
  app: {
    title: 'YaPult',
    subtitle: 'smart home remote'
  },
  topbar: {
    connected: 'Connected',
    connectionIssue: 'Connection issues',
    connectionIssueTooltip: 'Trouble reaching api.iot.yandex.net',
    connectionOkTooltip: 'Everything is fine',
    notAuthed: 'Not signed in',
    refresh: 'Refresh',
    refreshing: 'Refreshing…',
    updatedAt: 'Updated: {{time}}',
    login: 'Sign in with Yandex',
    logout: 'Sign out',
    account: 'Account',
    language: 'Language',
    settings: 'Settings'
  },
  settings: {
    title: 'Settings',
    language: 'Interface language',
    notifications: 'System notifications',
    notificationsHint: 'Show OS notifications for session loss, prolonged outages and finished scenarios',
    pollInterval: 'Device polling interval',
    seconds: 'sec',
    close: 'Done'
  },
  login: {
    title: 'Yandex Smart Home',
    subtitle: 'Sign in with your Yandex ID to see your rooms, devices and scenarios.',
    cta: 'Sign in with Yandex',
    notCompleted: 'Sign-in was not completed. Please try again.'
  },
  home: {
    scenarios: 'Scenarios',
    unassignedRoom: 'Unassigned',
    emptyTitle: 'Your Yandex smart home has no rooms, devices or scenarios yet.',
    loadingTitle: 'Loading your home…'
  },
  sidebar: {
    rooms: 'Rooms',
    groups: 'Groups',
    sensors: 'Sensors',
    scenarios: 'Scenarios',
    emptyRoom: 'No devices in this room yet',
    household: 'Home'
  },
  search: {
    placeholder: 'Search device or scenario…',
    devices: 'Devices',
    noResults: 'No results found'
  },
  groups: {
    title: 'Device groups',
    badge: 'Group',
    deviceCount: '{{count}} {{word}}',
    deviceWordOne: 'device',
    deviceWordFew: 'devices',
    deviceWordMany: 'devices'
  },
  device: {
    offline: 'Offline',
    unsupported: 'Controlling this device is not supported yet',
    noResponse: 'The device did not respond',
    power: 'Power',
    lightTemperature: 'Light temperature',
    color: 'Color',
    warm: 'Warm white',
    cool: 'Cool white',
    manufacturerModel: '{{manufacturer}} · {{model}}'
  },
  toast: {
    connectionRestored: 'Connection restored',
    longNoConnection: 'Still unable to reach the smart home server',
    scenarioLaunched: 'Scenario “{{name}}” started',
    scenarioError: 'Scenario “{{name}}”: {{message}}',
    scenarioInactive: 'Scenario “{{name}}” is disabled — enable it in the Yandex Smart Home app'
  },
  notify: {
    connectionLostTitle: 'YaPult — connection lost',
    scenarioDoneTitle: 'YaPult',
    scenarioDoneBody: 'Scenario “{{name}}” finished'
  },
  update: {
    available: 'Version {{version}} is available',
    open: 'Open'
  },
  error: {
    retry: 'Try again',
    retryShort: 'Retry',
    reload: 'Reload',
    somethingWrong: 'Something went wrong',
    kindTitle: {
      auth: 'Sign-in required',
      network: 'No connection',
      timeout: 'Server is not responding',
      api: 'Server error',
      scenarioInactive: 'Scenario disabled',
      unknown: 'Failed to load your home'
    }
  },
  deviceType: {
    'devices.types.light': 'Lighting',
    'devices.types.socket': 'Outlet',
    'devices.types.switch': 'Switch',
    'devices.types.thermostat': 'Thermostat',
    'devices.types.thermostat.ac': 'Air conditioner',
    'devices.types.vacuum_cleaner': 'Vacuum cleaner',
    'devices.types.humidifier': 'Humidifier',
    'devices.types.purifier': 'Air purifier',
    'devices.types.pump': 'Pump',
    'devices.types.pump.well': 'Pump',
    'devices.types.washing_machine': 'Washing machine',
    'devices.types.dishwasher': 'Dishwasher',
    'devices.types.kettle': 'Kettle',
    'devices.types.multicooker': 'Multicooker',
    'devices.types.cooking': 'Kitchen appliance',
    'devices.types.cooking.coffee_maker': 'Coffee maker',
    'devices.types.pet_feeder': 'Pet feeder',
    'devices.types.pet_drinking_fountain': 'Pet fountain',
    'devices.types.camera': 'Camera',
    'devices.types.smart_lock': 'Smart lock',
    'devices.types.media_device': 'Media device',
    'devices.types.media_device.tv': 'TV',
    'devices.types.media_device.tv_box': 'TV box',
    'devices.types.media_device.receiver': 'Receiver',
    'devices.types.openable': 'Opener',
    'devices.types.openable.curtain': 'Curtains',
    'devices.types.openable.valve': 'Valve',
    'devices.types.sensor': 'Sensor',
    'devices.types.sensor.button': 'Button',
    'devices.types.sensor.climate': 'Climate sensor',
    'devices.types.sensor.gas': 'Gas sensor',
    'devices.types.sensor.illumination': 'Illumination sensor',
    'devices.types.sensor.motion': 'Motion sensor',
    'devices.types.sensor.open': 'Open sensor',
    'devices.types.sensor.smoke': 'Smoke sensor',
    'devices.types.sensor.vibration': 'Vibration sensor',
    'devices.types.sensor.water_leak': 'Water leak sensor',
    'devices.types.other': 'Device',
    fallback: 'Device'
  },
  rangeInstance: {
    brightness: 'Brightness',
    temperature: 'Temperature',
    volume: 'Volume',
    channel: 'Channel',
    humidity: 'Humidity'
  },
  modeInstance: {
    program: 'Program',
    fan_speed: 'Fan speed',
    thermostat: 'Mode',
    swing: 'Swing direction',
    work_speed: 'Work speed'
  },
  toggleInstance: {
    backlight: 'Backlight',
    controls_locked: 'Controls lock',
    mute: 'Mute',
    pause: 'Pause'
  },
  propertyInstance: {
    temperature: 'Temperature',
    humidity: 'Humidity',
    co2_level: 'CO₂ level',
    'pm2.5_density': 'PM2.5',
    pm10_density: 'PM10',
    water_level: 'Water level',
    battery_level: 'Battery level',
    pressure: 'Pressure',
    illumination: 'Illumination',
    water_leak: 'Water leak',
    motion: 'Motion',
    smoke: 'Smoke',
    gas: 'Gas',
    button: 'Button',
    vibration: 'Vibration',
    open: 'Open',
    fallback: ''
  },
  colorName: {
    warmWhite: 'Warm white',
    coolWhite: 'Cool white',
    red: 'Red',
    orange: 'Orange',
    yellow: 'Yellow',
    green: 'Green',
    cyan: 'Cyan',
    blue: 'Blue',
    purple: 'Purple',
    pink: 'Pink'
  },
  unit: {
    mmHg: 'mmHg',
    lux: 'lx'
  }
} satisfies typeof ru

export const translations: Record<Lang, typeof ru> = { ru, en }
