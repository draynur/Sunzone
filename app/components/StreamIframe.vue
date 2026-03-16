<script setup lang="ts">
import { onMounted } from 'vue'

const props = defineProps<{
  channel: string
  hostname: string
}>()

const containerId = `twitch-player-${props.channel}`

interface TwitchPlayer {
  play(): void
}
interface TwitchEmbedInstance {
  addEventListener(event: string, cb: () => void): void
  getPlayer(): TwitchPlayer
}
interface TwitchEmbedConstructor {
  new(id: string, options: Record<string, unknown>): TwitchEmbedInstance
  VIDEO_READY: string
}
declare global {
  interface Window {
    Twitch: { Embed: TwitchEmbedConstructor }
  }
}

function loadTwitchSDK(): Promise<void> {
  return new Promise((resolve) => {
    if (window.Twitch?.Embed) { resolve(); return }
    let script = document.getElementById('twitch-embed-sdk') as HTMLScriptElement | null
    if (script) { script.addEventListener('load', () => resolve(), { once: true }); return }
    script = document.createElement('script')
    script.id = 'twitch-embed-sdk'
    script.src = 'https://embed.twitch.tv/embed/v1.js'
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

onMounted(async () => {
  await loadTwitchSDK()

  const parents = [
    props.hostname,
    'aistudio.google.com',
    'build.aistudio.google.com',
    'ai.studio',
    'build.ai.studio',
    'localhost',
  ].filter(Boolean)

  const embed = new window.Twitch.Embed(containerId, {
    width: '100%',
    height: '100%',
    channel: props.channel,
    parent: parents,
    muted: true,
    autoplay: true,
    layout: 'video',
  })

  embed.addEventListener(window.Twitch.Embed.VIDEO_READY, () => {
    embed.getPlayer().play()
  })
})
</script>

<template>
  <div :id="containerId" class="w-full h-full absolute inset-0 [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0" />
</template>
