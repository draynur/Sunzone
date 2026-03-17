import { ref, onMounted, onUnmounted } from 'vue'

export const CHANNELS = [
  'cstro34',
  'bradyschroeder7',
  'bigdinoboi76',
  'tpeek5',
  'itzeimer22',
  'loveland4president',
  'draynur'
]

// // TEST
// export const CHANNELS = [
//   'supertf',
//   'hasanabi',
//   'shroud',
//   'chess',
//   'emongg',
// ]

export type ChannelStatus = {
  isLive: boolean
  avatarUrl: string
  loading: boolean
}

export function useMultistream() {
  const hostname = ref('')
  const mode = ref<'grid' | 'featured'>('grid')
  const featured = ref(CHANNELS[0])
  const statuses = ref<Record<string, ChannelStatus>>({})
  const visibleChannels = ref<string[]>([...CHANNELS])
  const showChecklist = ref(false)
  const initialLoadDone = ref(false)

  const toggleChannel = (channel: string) => {
    if (visibleChannels.value.includes(channel)) {
      visibleChannels.value = visibleChannels.value.filter(c => c !== channel)
    } else {
      visibleChannels.value = [...visibleChannels.value, channel]
    }
  }

  const showAllChannels = () => {
    visibleChannels.value = [...CHANNELS]
  }

  const fetchStatuses = async (isInitial = false) => {
    if (isInitial) {
      const next = { ...statuses.value }
      CHANNELS.forEach(c => {
        if (!next[c]) {
          next[c] = { isLive: false, avatarUrl: '', loading: true }
        }
      })
      statuses.value = next
    }

    const newStatuses: Record<string, ChannelStatus> = {}
    const liveChannels: string[] = []

    await Promise.all(CHANNELS.map(async (channel) => {
      try {
        const [uptimeRes, avatarRes] = await Promise.all([
          fetch(`https://decapi.me/twitch/uptime/${channel}`),
          fetch(`https://decapi.me/twitch/avatar/${channel}`)
        ])

        const uptimeText = await uptimeRes.text()
        const avatarUrl = await avatarRes.text()

        const isLive = !uptimeText.toLowerCase().includes('offline') &&
                       !uptimeText.toLowerCase().includes('error') &&
                       !uptimeText.toLowerCase().includes('not found')

        newStatuses[channel] = { isLive, avatarUrl, loading: false }
        if (isLive) liveChannels.push(channel)
      } catch (err) {
        console.error(`Failed to fetch status for ${channel}`, err)
        newStatuses[channel] = { isLive: false, avatarUrl: '', loading: false }
      }
    }))

    statuses.value = { ...statuses.value, ...newStatuses }

    if (isInitial) {
      visibleChannels.value = liveChannels
      if (liveChannels.length > 0) {
        featured.value = liveChannels[0]
      }
      initialLoadDone.value = true
    }
  }

  let interval: ReturnType<typeof setInterval>

  onMounted(() => {
    hostname.value = window.location.hostname
    fetchStatuses(true)
    interval = setInterval(() => fetchStatuses(false), 120000)
  })

  onUnmounted(() => {
    clearInterval(interval)
  })

  return {
    hostname,
    mode,
    featured,
    statuses,
    visibleChannels,
    showChecklist,
    initialLoadDone,
    toggleChannel,
    showAllChannels,
  }
}
