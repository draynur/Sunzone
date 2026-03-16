<script setup lang="ts">
import type { ChannelStatus } from '~/composables/useMultistream'

defineProps<{
  channel: string
  hostname: string
  status?: ChannelStatus
}>()
</script>

<template>
  <!-- Loading -->
  <div v-if="!status || status.loading" class="w-full h-full absolute inset-0 bg-neutral-900 flex items-center justify-center border-0">
    <div class="w-6 h-6 rounded-full border-2 border-white/20 border-t-white/80 animate-spin"></div>
  </div>

  <!-- Offline -->
  <div v-else-if="!status.isLive" class="w-full h-full absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center gap-3 border-0">
    <div class="relative">
      <img
        v-if="status.avatarUrl && !status.avatarUrl.includes('error')"
        :src="status.avatarUrl"
        :alt="channel"
        class="w-16 h-16 rounded-full border-2 border-white/10 grayscale opacity-50 object-cover"
        referrerpolicy="no-referrer"
      />
      <div v-else class="w-16 h-16 rounded-full border-2 border-white/10 bg-neutral-800 flex items-center justify-center">
        <span class="text-white/30 text-xl font-bold">{{ channel[0].toUpperCase() }}</span>
      </div>
      <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-neutral-800 text-white/50 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-white/10 shadow-lg">
        Away
      </div>
    </div>
    <div class="text-white/40 font-medium text-sm tracking-wide">
      {{ channel }}
    </div>
  </div>

  <!-- Live -->
  <StreamIframe v-else :channel="channel" :hostname="hostname" />
</template>
