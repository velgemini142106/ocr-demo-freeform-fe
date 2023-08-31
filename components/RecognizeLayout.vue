<script lang="ts" setup>
import {computed, onBeforeUnmount, onMounted, ref} from 'vue'
import {clientExec} from "~/utils/processUtils";
import {useMenuStore, useSideBarMenuStore} from "~/store/global";

const sideBarMenuStore = useSideBarMenuStore()
const sideBar = sideBarMenuStore.menuData

const mobileBreakPointPX = 640
const tabletBreakPointPX = 768

const sidebarWidth = ref('16rem')
const sidebarMinimizedWidth = ref('0')

const isMobile = ref(false)
const isTablet = ref(false)
const isSidebarMinimized = computed(() => sideBarMenuStore.getSideBarState)

const checkIsTablet = () => window.innerWidth <= tabletBreakPointPX
const checkIsMobile = () => window.innerWidth <= mobileBreakPointPX

const onResize = () => {
  sideBarMenuStore.updateSideBar(checkIsTablet())
  isMobile.value = checkIsMobile()
  isTablet.value = checkIsTablet()
  sidebarMinimizedWidth.value = isMobile.value ? '0' : '4.5rem'
  sidebarWidth.value = isTablet.value ? '100%' : '16rem'
}

onMounted(() => {
  clientExec(() => window.addEventListener('resize', onResize))
})

onBeforeUnmount(() => {
  clientExec(() => window.removeEventListener('resize', onResize))
})


clientExec(() => onResize())

const showHideSidebar = () => sideBarMenuStore.updateSideBar()

const store = useMenuStore()
const updateMenuStyle = (item: string) => {
  store.calculateMenuStyleFromSideBar(item)
}

const url = useRequestURL()
updateMenuStyle(url.pathname)
</script>

<template>
  <div class="app-layout">
    <div class="app-layout__content">
      <div :class="{ minimized: isSidebarMinimized }" class="app-layout__sidebar-wrapper">
        <client-only>
          <va-sidebar
              :animated="!isMobile"
              :minimized="isSidebarMinimized"
              :minimized-width="sidebarMinimizedWidth"
              :width="sidebarWidth"
          >
            <va-sidebar-item v-for="(item, index) in sideBar" :key="index" @click="updateMenuStyle(item.link)">
              <NuxtLink :to="item.activate ? item.link : null">
                <va-sidebar-item-content>
                  <va-icon :name="item.icon"/>
                  <va-sidebar-item-title>
                    {{ item.name }}
                    <va-badge
                        :text="item.activate ? '': 'Comming soon'"
                        color="warning"
                        overlap
                    ></va-badge>
                  </va-sidebar-item-title>
                </va-sidebar-item-content>
              </NuxtLink>
            </va-sidebar-item>
            <div v-if="isMobile || isTablet"
                 class="flex justify-center items-end absolute bottom-10 left-0 w-full px-4">
              <va-button class="btn-show-hide" @click="showHideSidebar"> Hide</va-button>
            </div>
          </va-sidebar>
        </client-only>

      </div>
      <div class="app-layout__page">
        <div class="p-2 md:px-6 md:py-9 va-gutter-5 sm:va-gutter-2">
          <div class="container mx-auto">
            <slot></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
$mobileBreakPointPX: 640px;
$tabletBreakPointPX: 768px;

.app-layout {
  height: 90vh;
  display: flex;
  flex-direction: column;

  &__navbar {
    min-height: 4rem;
  }

  &__content {
    display: flex;
    height: calc(90vh - 4rem);
    flex: 1;

    @media screen and (max-width: $tabletBreakPointPX) {
      height: calc(100vh - 6.5rem);
    }

    .app-layout__sidebar-wrapper {
      position: relative;
      height: 100%;
      background: #ffffff;

      @media screen and (max-width: $tabletBreakPointPX) {
        &:not(.minimized) {
          width: 100%;
          height: 100%;
          position: fixed;
          top: 0;
          z-index: 999;
        }

        .va-sidebar:not(.va-sidebar--minimized) {
          .va-sidebar__menu {
            padding: 0;
          }
        }
      }
    }
  }

  &__page {
    flex-grow: 2;
    overflow-y: scroll;
  }
}

.btn-show-hide {
  --va-button-size: 100%
}
</style>