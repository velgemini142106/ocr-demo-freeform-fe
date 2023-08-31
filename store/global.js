import {defineStore} from 'pinia'

export const useMenuStore = defineStore('menu', {
    state: () => ({
        menu: [
            {
                link: "/",
                name: "Dashboard",
                class: "menu-link",
            },
            {
                link: "/recognize",
                name: "Recognize",
                class: "menu-link",
            },
            {
                link: "/terms",
                name: "Terms",
                class: "menu-link",
            }
        ]
    }),
    getters: {
        menuData: (state) => state.menu
    },
    actions: {
        calculateMenuStyle(currentUrl) {
            this.menu.forEach((item) => {
                if (currentUrl === item.link) {
                    item.class = 'menu-link router-link-exact-active'
                } else {
                    item.class = 'menu-link'
                }
            })
        },
        calculateMenuStyleFromSideBar(currentUrl) {
            this.menu.forEach((item) => {
                if (currentUrl.includes(item.link) && item.link !== '/') {
                    item.class = 'menu-link router-link-exact-active'
                } else {
                    item.class = 'menu-link'
                }
            })
        }
    }
});

export const useSideBarMenuStore = defineStore('slide-bar', {
    state: () => ({
        isSidebarMinimized: false,
        menu: [
            {
                link: "/recognize/document",
                icon: 'document_scanner',
                name: 'Document Analysis',
                activate: true,
            },
            {
                link: "/recognize/face",
                icon: 'face',
                name: 'Face recognize',
                activate: false,
            },
            {
                link: "/recognize/image",
                icon: 'image_search',
                name: 'Image processing',
                activate: false
            },
            {
                link: "/recognize/ekyc",
                icon: 'center_focus_weak',
                name: 'eKYC',
                activate: false
            }
        ]
    }),
    getters: {
        menuData: (state) => state.menu,
        getSideBarState: (state) => state.isSidebarMinimized,
    },
    actions: {
        updateSideBar(enable) {
            if(enable === undefined || enable === null) {
                this.isSidebarMinimized = !this.isSidebarMinimized
            } else {
                this.isSidebarMinimized = enable
            }

        }
    }
})