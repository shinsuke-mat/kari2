<template>
    <div class="wrapper" ref="wrapper">
        <div class="button">
            <label>
                <input type="checkbox"
                       v-model="showAllEdges">
                Show all edges
            </label>
        </div>
        <div class="content" ref="content">
            <ZoomPanUI></ZoomPanUI>
            <svg :width="width"
                 :height="height"
                 :viewBox="viewBox"
                 @click="onClick"
                 @wheel="onWheel">
                <g transform="translate(20, 20)">
                    <GNode v-for="node in nodes"
                           :key="node.id"
                           :node="node">
                    </GNode>

                    <GEdge v-for="edge in edges"
                           :key="edge.id"
                           :edge="edge">
                    </GEdge>
                </g>

                <text v-if="maxGeneration > 1"
                      v-for="generation in maxGeneration"
                      x="0"
                      :y="40 + (15 + 100)*(generation-1)"
                      class="label">
                    {{generation - 1}}
                </text>
            </svg>
            <Popup></Popup>
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Vue, Watch} from 'vue-property-decorator';
    import {Color} from "../../scripts/color/Color";
    import SimpleLine from "./edge/SimpleLine.vue";
    import CrossNode from "./node/CrossNode.vue";
    import CircleNode from "./node/CircleNode.vue";
    import {ThreeBasePointsGradation} from "../../n2/node/strategy/color/ThreeBasePointsGradation";
    import {NoAlignHierarchy} from "../../n2/node/strategy/position/NoAlignHierarchy";
    import Popup from "../Popup.vue";
    import DoubleLine from "./edge/DoubleLine.vue";
    import {ViewBox} from "../../store/LayoutStore";
    import {sprintf} from "sprintf-js";
    import GNode from "./node/GNode.vue";
    import GEdge from "./edge/GEdge.vue";
    import {EdgeDatum3, NodeDatum3} from "../../scripts/json/Layout";
    import {Tyukan} from "../../scripts/json/Tyukan";
    import {NodeDatum2} from "../../scripts/json/NodeDatum2";
    import ZoomPanUI from "../ZoomPanUI.vue";

    @Component({components: {ZoomPanUI, GEdge, GNode, DoubleLine, Popup, SimpleLine, CrossNode, CircleNode}})
    export default class Basic extends Vue {

        /**
         * data
         * */
        private showAllEdges: boolean = false;

        private unwatch: () => void = () => {
        };

        /**
         *  computed
         *  */
        get nodes(): NodeDatum3[] {
            return this.$store.getters['LayoutStore/allNodes'];
        }

        get edges(): EdgeDatum3[] {
            return this.$store.getters['LayoutStore/allEdges'];
        }

        get width() {
            const content = this.$refs.content;

            if (content instanceof Element) {
                const svgWidth = this.$store.getters['LayoutStore/svgWidth'] + 40;
                const contentWidth = content.getBoundingClientRect().width;

                return Math.max(contentWidth);
            } else {
                return this.$store.getters['LayoutStore/svgWidth'] + 40;
            }
        }

        get height() {
            const content = this.$refs.content;

            if (content instanceof Element) {
                const svgHeight = this.$store.getters['LayoutStore/svgHeight'] + 40;
                const contentHeight = content.getBoundingClientRect().height;

                return contentHeight;
            } else {
                return this.$store.getters['LayoutStore/svgWidth'] + 40;
            }
        }

        get viewBox(): string {
            const viewBox: ViewBox = this.$store.getters['LayoutStore/viewBox'];
            return sprintf('%.3f, %.3f, %.3f, %.3f',
                           viewBox.minX, viewBox.minY, viewBox.width, viewBox.height);
        }

        get maxGeneration(): number {
            const t: Tyukan = this.$store.getters['VariantStore/tyukan'];

            return t.maxGeneration + 1;
        }

        /**
         * custom event handler
         * */
        onClick(event: MouseEvent) {
            this.$store.commit('DiffStore/reset', {});
            this.$store.commit('LayoutStore/clearNodeClass', {});
            this.$store.commit('LayoutStore/clearEdgeClass', {});
        }

        onWheel(e: WheelEvent) {
            e.preventDefault();
            e.stopPropagation();

            console.log('Wheel Event ' + performance.now());

            this.$store.commit('LayoutStore/pan', {
                offset: {
                    x: 0,
                    y: -e.deltaY
                }
            });
        }

        private get contentWidth(): number {
            const content = this.$refs.content;

            if (content instanceof Element) {
                return content.getBoundingClientRect().width;
            } else {
                return 100;
            }
        }

        private get contentHeight(): number {
            const content = this.$refs.content;

            if (content instanceof Element) {
                return content.getBoundingClientRect().height;
            } else {
                return 100;
            }
        }

        /**
         * life cycle
         * */
        created() {
            this.unwatch = this.$store.watch(
                state => state.VariantStore.idToVariant,
                () => this.apply());

            const midCalculator = (variants: Tyukan) => {
                const a: NodeDatum2[] = variants.hiassyukus();

                for (let i = 0; i < a.length; i++) {
                    if (a[i].variant.id === 0) {
                        return a[i].variant.fitness;
                    }
                }
                return 0.5;
            };

            this.$store.commit('LayoutStore/setNodeColorStrategy', {
                nodeColorStrategy: new ThreeBasePointsGradation(
                    [
                        Color.RED,
                        Color.WHITE,
                        Color.GREEN
                    ], midCalculator)
            });

            this.$store.commit('LayoutStore/setNodePositionStrategy',
                               {nodePositionStrategy: new NoAlignHierarchy()});
        }


        // beforeCreate(){
        //     console.log('A ' + performance.now());
        // }

        mounted() {
            this.apply();
        }

        updated(){
            console.log('Updated ' + performance.now());
        }

        beforeDestroy() {
            // ウォッチャをリセットする
            this.unwatch();
        }

        /**
         * watcher
         * */
        @Watch('showAllEdges')
        onValueChange(newValue: boolean): void {
            if (newValue) {
                this.$store.commit('LayoutStore/showAllEdges');
            } else {
                this.$store.commit('LayoutStore/dismissCrossEdges');
            }
        }

        apply() {
            const variants: Tyukan = this.$store.getters['VariantStore/tyukan'];
            this.$store.commit('LayoutStore/apply', {
                variants: variants,
                content: {
                    width: this.contentWidth,
                    height: this.contentHeight
                }
            });
            this.$store.commit('LayoutStore/dismissCrossEdges');
            this.$store.commit('Layout')
        }
    }
</script>

<style scoped>
    .wrapper {
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    svg {
        z-index: 0;
    }

    .content {
        width: 100%;
        height: 100%;
        /*overflow-y: hidden;*/
        /*overflow-x: scroll;*/
    }
</style>
<style>
    path {
        vector-effect: non-scaling-stroke;
        stroke-width: 1;
        stroke: #000000;
    }

    circle {
        vector-effect: non-scaling-stroke;
        stroke-width: 1;
        stroke: #000000;
    }

    line {
        vector-effect: non-scaling-stroke;
        stroke: #000000;
        stroke-width: 1;
    }

    text {
        stroke: none;
        fill: #000000;
        font-size: 1px;
    }

    .label {
        font-size: 20px;
    }
</style>
