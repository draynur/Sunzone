<script setup lang="ts">
import { computed } from 'vue'
import { LayoutGrid, Monitor, ListFilter, MonitorOff, EyeOff } from 'lucide-vue-next'
import { CHANNELS, useMultistream } from '~/composables/useMultistream'

const {
  hostname,
  mode,
  featured,
  statuses,
  visibleChannels,
  showChecklist,
  initialLoadDone,
  toggleChannel,
  showAllChannels,
} = useMultistream()

const displayedChannels = computed(() => CHANNELS.filter(c => visibleChannels.value.includes(c)))
const anyLive = computed(() => CHANNELS.some(c => statuses.value[c]?.isLive))
const activeFeatured = computed(() =>
  displayedChannels.value.includes(featured.value) ? featured.value : displayedChannels.value[0]
)

const gridClass = computed(() => {
  const count = displayedChannels.value.length
  if (count === 1) return 'grid-cols-1'
  if (count === 2 || count === 3) return 'grid-cols-1 md:grid-cols-2'
  if (count === 4) return 'grid-cols-1 md:grid-cols-2'
  if (count === 5 || count === 6) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
})
</script>

<template>
  <!-- Loading gate -->
  <div v-if="!initialLoadDone" class="w-screen h-screen bg-neutral-950 flex items-center justify-center">
    <div class="text-white/50 animate-pulse font-mono">Loading streams...</div>
  </div>

  <!-- Main content -->
  <div v-else class="w-screen h-screen bg-neutral-950 overflow-hidden relative font-sans text-white">

    <!-- Toolbar -->
    <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-50">

      <!-- Checklist Popover -->
      <Transition name="popover">
        <div
          v-if="showChecklist"
          class="bg-neutral-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex flex-col gap-3 min-w-[240px]"
        >
          <div class="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 class="text-white/70 text-xs font-bold uppercase tracking-wider">Visible Channels</h3>
            <button @click="showAllChannels()" class="text-xs text-white/40 hover:text-white transition-colors">
              Show All
            </button>
          </div>
          <div class="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-2">
            <label v-for="channel in CHANNELS" :key="channel" class="flex items-center justify-between cursor-pointer group">
              <div class="flex items-center gap-3">
                <input type="checkbox" class="hidden" :checked="visibleChannels.includes(channel)" @change="toggleChannel(channel)" />
                <div :class="['w-4 h-4 rounded border flex items-center justify-center transition-colors', visibleChannels.includes(channel) ? 'bg-white border-white' : 'border-white/30 group-hover:border-white/60']">
                  <div v-if="visibleChannels.includes(channel)" class="w-2 h-2 bg-black rounded-sm" />
                </div>
                <span :class="['text-sm transition-colors', visibleChannels.includes(channel) ? 'text-white' : 'text-white/50 group-hover:text-white/80']">
                  {{ channel }}
                </span>
              </div>
              <div
                v-if="statuses[channel] && !statuses[channel].loading"
                :class="['w-2 h-2 rounded-full', statuses[channel].isLive ? 'bg-red-500' : 'bg-white/20']"
                :title="statuses[channel].isLive ? 'Live' : 'Away'"
              />
            </label>
          </div>
        </div>
      </Transition>

      <div class="bg-neutral-900/80 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl flex gap-1 shadow-2xl">
        <button
          @click="mode = 'grid'"
          :class="['p-3 rounded-xl transition-all flex items-center gap-2', mode === 'grid' ? 'bg-white/10 text-white shadow-inner' : 'text-white/50 hover:text-white hover:bg-white/5']"
        >
          <LayoutGrid class="w-5 h-5" />
          <span class="text-sm font-medium hidden md:block">Grid</span>
        </button>
        <div class="w-px bg-white/10 my-2 mx-1"></div>
        <button
          @click="showChecklist = !showChecklist"
          :class="['p-3 rounded-xl transition-all flex items-center gap-2', showChecklist ? 'bg-white/10 text-white shadow-inner' : 'text-white/50 hover:text-white hover:bg-white/5']"
        >
          <ListFilter class="w-5 h-5" />
          <span class="text-sm font-medium hidden md:block">Channels</span>
        </button>
      </div>
    </div>

    <!-- Layouts -->
    <div :class="['w-full h-full p-2 gap-2', mode === 'grid' ? `grid ${gridClass} auto-rows-fr` : 'flex flex-col lg:flex-row']">

      <!-- Empty state -->
      <div v-if="displayedChannels.length === 0" class="col-span-full flex flex-col items-center justify-center text-white/50 h-full w-full">
        <MonitorOff class="w-12 h-12 mb-4 opacity-20" />
        <p>{{ anyLive ? 'No channels selected.' : 'No one is currently streaming.' }}</p>
        <button @click="showAllChannels()" class="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm">
          Show All Channels
        </button>
      </div>

      <template v-else>
        <!-- Featured main stream -->
        <div v-if="mode === 'featured' && activeFeatured" class="flex-grow rounded-xl overflow-hidden bg-black relative shadow-2xl border border-white/10 group">
          <div class="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/90 via-black/40 to-transparent z-20 flex justify-between items-center pointer-events-none">
            <span class="font-semibold text-sm drop-shadow-md px-2">{{ activeFeatured }}</span>
            <button
              @click.stop="toggleChannel(activeFeatured)"
              class="p-2 hover:bg-white/20 rounded-md transition-colors text-white/70 hover:text-white cursor-pointer pointer-events-auto"
              title="Hide channel"
            >
              <EyeOff class="w-4 h-4" />
            </button>
          </div>
          <ChannelCard :channel="activeFeatured" :hostname="hostname" :status="statuses[activeFeatured]" />
        </div>

        <!-- Sidebar / grid items -->
        <div :class="mode === 'featured' ? 'flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:w-64 xl:w-80 shrink-0 pb-20 lg:pb-0' : 'contents'">
          <template v-for="channel in displayedChannels" :key="channel">
            <div
              v-if="!(mode === 'featured' && channel === activeFeatured)"
              @click="mode === 'featured' && (featured = channel)"
              :class="[
                'rounded-xl overflow-hidden bg-black shadow-lg border border-white/10 relative group',
                mode === 'featured'
                  ? 'w-48 lg:w-full aspect-video shrink-0 cursor-pointer opacity-60 hover:opacity-100 transition-opacity ring-2 ring-transparent hover:ring-white/20'
                  : 'w-full h-full min-h-[200px]'
              ]"
            >
              <div class="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/90 via-black/40 to-transparent z-30 flex justify-between items-center pointer-events-none">
                <span class="font-semibold text-xs drop-shadow-md px-2">{{ channel }}</span>
                <button
                  @click.stop="toggleChannel(channel)"
                  class="p-1.5 hover:bg-white/20 rounded-md transition-colors text-white/70 hover:text-white cursor-pointer pointer-events-auto"
                  title="Hide channel"
                >
                  <EyeOff class="w-3.5 h-3.5" />
                </button>
              </div>
              <!-- Pointer-capture overlay (featured sidebar only): gradient + blur shield over iframe -->
              <div v-if="mode === 'featured'" class="absolute inset-0 z-10 bg-gradient-to-br from-transparent to-black/75 backdrop-blur-[2px]">
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <Monitor class="w-8 h-8 text-white drop-shadow-lg" />
                </div>
              </div>
              <ChannelCard :channel="channel" :hostname="hostname" :status="statuses[channel]" />
            </div>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.popover-enter-active,
.popover-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}
.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}
</style>
