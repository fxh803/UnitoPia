import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAnimationStore } from '~/stores/animation'
import { useCollageSeriesStore } from '~/stores/collageSeries'
import { storeToRefs } from 'pinia'
import paper from 'paper'
// 定义container记录的数据结构
interface ContainerRecord {
    overviewId: string
    overviewIdx: number
    slideId: string
    slideIndex: number
    container: string // base64字符串
}

export const useContainerStore = defineStore('container', () => {
    // 存储所有container记录
    const containerRecords = ref<ContainerRecord[]>([])
    const shining_paths = ref<paper.Raster[]>([])
    const collageSeriesStore = useCollageSeriesStore()

    // 添加container记录
    function addContainerRecord(overviewId: string, overviewIdx: number, slideId: string, slideIndex: number, container: string) {
        const record: ContainerRecord = {
            overviewId,
            overviewIdx,
            slideId,
            slideIndex,
            container
        }
        containerRecords.value.push(record)
    }

    function containerAnimation(event) {
        const animationStore = useAnimationStore()
        const { collaging, now_overview_idx, now_collage_idx } = storeToRefs(animationStore)

        // 检查collaging状态，如果为false则停止动画
        if (!collaging.value) {
            return
        }

        for (const path of shining_paths.value) {
            if (path.overviewIdx === now_overview_idx.value && path.slideIndex === now_collage_idx.value) {
                path.opacity += path.changeRate * event.delta;
                if (path.opacity >= 0.3 && !path.initialized) {
                    path.initialized = true;
                }
                if (path.initialized) {
                    if (path.opacity > 0.5) {
                        path.opacity = 0.5;
                        path.changeRate = -0.2;
                    } else if (path.opacity < 0.3) {
                        path.opacity = 0.3;
                        path.changeRate = 0.2;
                    }
                }
            }
            else {
                if (path.opacity <= 0) {
                    path.opacity = 0; 
                    continue;
                }
                path.opacity += path.changeRate * event.delta;
                path.changeRate = -0.2;
            }
        }
    }

    function createShiningPaths() {
        const { currentOverviewIndex } = storeToRefs(collageSeriesStore) 
        for (let i = 0; i < containerRecords.value.length; i++) {
            if (containerRecords.value[i].overviewIdx !== currentOverviewIndex.value) {//这个是只进行当前overview的代码段，注意
                continue
            }
            const item = containerRecords.value[i]
            const raster = new paper.Raster({
                source: item.container,
                position: paper.view.center,
                slideIndex: item.slideIndex,
                overviewIdx: item.overviewIdx,
                opacity: 0,
                dataType: 'container',
                initialized:false,
                changeRate: 0.2,
                onError: (e) => {
                    console.log('onError', e)
                }
            })
            shining_paths.value.push(raster) 
        } 
    }

    // 清空所有记录
    function clearAllRecords() {
        containerRecords.value = []
    }

    // 清理shining paths
    function clearShiningPaths() {
        shining_paths.value.forEach(path => {
            if (path && path.remove) {
                path.remove()
            }
        })
        shining_paths.value = []
    }


    return {
        containerRecords,
        addContainerRecord,
        clearAllRecords,
        containerAnimation,
        createShiningPaths,
        clearShiningPaths
    }
})
