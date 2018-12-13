import {GraphNode} from "@/scripts/data/network/GraphNode";
import {Layout} from "@/scripts/data/network/Layout";
import {LayoutFactory} from "@/scripts/network/layout/LayoutFactory";
import {DefaultNodeColor} from "@/scripts/network/node/strategy/color/DefaultNodeColor";
import {DefaultNodePosition} from "@/scripts/network/node/strategy/position/DefaultNodePosition";
import {DefaultNodeSize} from "@/scripts/network/node/strategy/size/DefaultNodeSize";
import {DefaultNodeShape} from "@/scripts/network/node/strategy/shape/DefaultNodeShape";
import {GraphNodeSet} from "@/scripts/data/network/GraphNodeSet";
import {GraphEdgeSet} from "@/scripts/data/network/GraphEdgeSet";

export interface LayoutStoreState {
    layoutStrategy: LayoutFactory,
    layout: Layout | null
}

const state: LayoutStoreState = {
    layoutStrategy: new LayoutFactory(
        new DefaultNodeColor(),
        new DefaultNodePosition(),
        new DefaultNodeSize(),
        new DefaultNodeShape()
    ),
    layout: null,
};

const getters = {
    allNodes: state => (state.layout !== null) ? state.layout.nodes.values() : [],

    allEdges: state => (state.layout !== null) ? state.layout.edges.values() : [],

    filteredNodes: state =>
        (filter: (node: GraphNode) => boolean) =>
            (state.layout !== null) ? state.layout.nodes.filter(filter) : [],

    svgHeight: state => (state.layout !== null) ? state.layout.height : 0,

    svgWidth: state => (state.layout !== null) ? state.layout.width : 0
};

const mutations = {
    setNodeColorStrategy: (state, payload) =>
        state.layoutStrategy.setNodeColorStrategy(payload.nodeColorStrategy),

    setNodePositionStrategy: (state, payload) =>
        state.layoutStrategy.setNodePositionStrategy(payload.nodePositionStrategy),

    setNodeSizeStrategy: (state, payload) =>
        state.layoutStrategy.setNodeSizeStrategy(payload.nodeSizeStrategy),

    setNodeShapeStrategy: (state, payload) =>
        state.layoutStrategy.setNodeShapeStrategy(payload.nodeShapeStrategy),

    apply: (state, payload) => {
        state.layout = state.layoutStrategy
                            .exec(payload.variants,
                                  payload.maxGenerationNumber,
                                  payload.generationNumberToVariantCount,
                                  30,
                                  20);
    },

    setElementHighlightState: (state, payload) => {
        const id: string = payload.id;
        const highlightState: boolean = payload.highlightState;
        const nodes: GraphNodeSet = state.layout.nodes;
        const edges: GraphEdgeSet = state.layout.edges;

        if (nodes.has(id)) {
            const node: GraphNode = nodes.get(id);
            node.highlighted = highlightState;
        }

        if (edges.has(id)) {
            const edge: GraphNode = nodes.get(id);
            edge.highlighted = highlightState;
        }
    },

    // TODO Nodeのクラスを変更する
    changeNodeClass: (state, payload) => {

    },

    // TODO Nodeのクラスをリセットする
    resetNodeClass: (state, payload) => {

    }
};

const actions = {};

export const LayoutStore = {
    namespaced: true,
    state: state,
    getters: getters,
    mutations: mutations,
    actions: actions
};
