import {LayoutStrategies} from "@/n2/layout/LayoutStrategies";
import {DefaultNodeColorStrategy} from "@/n2/node/strategy/color/DefaultNodeColorStrategy";
import {DefaultNodePositionStrategy} from "@/n2/node/strategy/position/DefaultNodePositionStrategy";
import {EdgeDatum3, Layout2, NodeDatum3} from "@/scripts/json/Layout";
import {GraphNodeSet2} from "@/scripts/json/GraphNodeSet2";
import {GraphEdgeSet2} from "@/scripts/json/GraphEdgeSet2";

export type ViewBox = {
    minX: number,
    minY: number,
    width: number,
    height: number
}

type Size = {
    width: number,
    height: number
}

export interface LayoutStoreState {
    layoutStrategy: LayoutStrategies,
    layout: Layout2 | null,
    viewBox: ViewBox,
    size: Size,
    scale: number
}

const state: LayoutStoreState = {
    layoutStrategy: new LayoutStrategies(
        new DefaultNodeColorStrategy(),
        new DefaultNodePositionStrategy(),
    ),
    layout: null,
    viewBox: {
        minX: 0,
        minY: 0,
        width: 100,
        height: 100
    },
    size: {
        width: 100,
        height: 100
    },
    scale: 1
};

const getters = {
    allNodes: state => (state.layout !== null) ? state.layout.nodes.values() : [],

    allEdges: state => (state.layout !== null) ? state.layout.edges.values() : [],

    edge: state => (id: string) => (state.layout !== null) ? state.layout.edges.get(id) : undefined,

    svgHeight: state => (state.layout !== null) ? state.layout.height : 0,

    svgWidth: state => (state.layout !== null) ? state.layout.width : 0,

    viewBox: state => state.viewBox,

    scale: state => state.scale
};

const mutations = {
    setNodeColorStrategy: (state, payload) =>
        state.layoutStrategy.setNodeColorStrategy(payload.nodeColorStrategy),

    setNodePositionStrategy: (state, payload) =>
        state.layoutStrategy.setNodePositionStrategy(payload.nodePositionStrategy),

    apply: (state, payload) => {
        state.layout = state.layoutStrategy
                            .exec(payload.variants, 30, 20);

        // 初期状態は全体が収まるように設定
        const svgWidth: number = state.layout.width + 40;
        const svgHeight: number = state.layout.height + 40;

        state.size = {
            width: payload.content.width,
            height: payload.content.height
        };
        state.scale = 1;
        state.viewBox = {
            minX: -100,
            minY: 0,
            width: state.size.width,
            height: state.size.height
        };
    },

    reset: (state, payload: { content: { width: number, height: number } }) => {

        // 初期状態は全体が収まるように設定
        const svgWidth: number = state.layout.width + 40;
        const svgHeight: number = state.layout.height + 40;

        state.scale = 1;
        state.viewBox = {
            minX: 0,
            minY: 0,
            width: state.size.width,
            height: state.size.height
        };
    },

    setScale: (state, payload: { scale: number }) => {
        const scale: number = payload.scale;
        state.scale = scale;

        // ズームを行う
        const width: number = state.size.width;
        const height: number = state.size.height;
        // 大きさをscale倍する
        const zoomedWidth = width / scale;
        const zoomedHeight = height / scale;

        // 中心の座標を計算する
        const minX: number = state.viewBox.minX;
        const minY: number = state.viewBox.minY;
        const centerX = minX + width / 2.0;
        const centerY = minY + height / 2.0;

        state.viewBox = {
            minX: minX,
            minY: minY,
            width: zoomedWidth,
            height: zoomedHeight
        };
    },

    zoom: (state,
           payload: {
               cursor: { x: number, y: number },
               scale: number,
           }) => {
        // 正規化する
        const svgWidth: number = state.layout.width + 40;
        const svgHeight: number = state.layout.height + 40;
        const xRatio: number = payload.cursor.x / svgWidth;
        const yRatio: number = payload.cursor.y / svgHeight;

        // 正規化した座標を元にviewBox上におけるカーソルの位置を求める
        const scale = payload.scale;
        const x = state.viewBox.minX + state.viewBox.width * xRatio;
        const y = state.viewBox.minY + state.viewBox.height * yRatio;

        state.viewBox = {
            minX: x + scale * (state.viewBox.minX - x),
            minY: y + scale * (state.viewBox.minY - y),
            width: state.viewBox.width * scale,
            height: state.viewBox.height * scale
        };
    },

    pan: (state,
          payload: {
              offset: { x: number, y: number }
          }) => {
        const scale: number = state.scale;
        state.viewBox = {
            minX: state.viewBox.minX - payload.offset.x,
            minY: state.viewBox.minY - payload.offset.y,
            width: state.viewBox.width,
            height: state.viewBox.height
        }
    },

    highlightAncestryTree: (state, payload) => {
        const id: string = payload.id;

        const nodes: GraphNodeSet2 = state.layout.nodes;
        const edges: GraphEdgeSet2 = state.layout.edges;

        if (!nodes.has(id)) {
            return;
        }

        const node: NodeDatum3 = nodes.get(id);
        // 選択したノードをハイライトする
        node.classes.push('selected');

        // 再帰的に経路をハイライトする
        // 祖先
        node.inEdgeIds
            .forEach((edgeId) => highlightAncestor(edgeId, nodes, edges));
        // highlightAncestor(, nodes, edges);
        // 子孫
        node.outEdgeIds
            .forEach((edgeId) => highlightDescendant(edgeId, nodes, edges));

        // highlightDescendant(id, nodes, edges);
    },

    clearNodeClass: (state, payload) => {

        state.layout.nodes.values()
             .forEach((n) => n.classes = []);
    },

    clearEdgeClass: (state, payload) => {
        state.layout.edges.values()
             .forEach((e) => e.classes = []);
    },

    showAllEdges: (state) => {
        const edges: GraphEdgeSet2 = state.layout.edges;
        edges.values()
             .forEach((e) => e.isDisplay = true);
    },

    dismissCrossEdges: (state) => {
        const nodes: GraphNodeSet2 = state.layout.nodes;
        const edges: GraphEdgeSet2 = state.layout.edges;
        const inEdges: EdgeDatum3[] = [];

        nodes.values()
             .forEach((n) => {
                 if (n.shape !== 'cross') {
                     return;
                 }
                 n.inEdgeIds.forEach((e) => inEdges.push(edges.get(e)));
             });

        inEdges.forEach((e) => e.isDisplay = false);
    }
};

function highlightAncestor(id: string, nodes: GraphNodeSet2, edges: GraphEdgeSet2) {
    if (nodes.has(id)) {
        const node = nodes.get(id);
        node.classes.push('highlight');

        // 祖先に繋がる辺をハイライトする
        node.inEdgeIds
            .forEach((inEdgeId) => highlightAncestor(inEdgeId, nodes, edges));

    } else if (edges.has(id)) {
        const edge = edges.get(id);
        edge.classes.push('highlight');

        highlightAncestor(edge.sourceId, nodes, edges);
    }
}

function highlightDescendant(id: string, nodes: GraphNodeSet2, edges: GraphEdgeSet2) {
    if (nodes.has(id)) {
        const node = nodes.get(id);
        node.classes.push('highlight');

        // 子孫に繋がる辺をハイライトする
        node.outEdgeIds
            .forEach((outEdgeId) => {
                highlightDescendant(outEdgeId, nodes, edges);
            });
    } else if (edges.has(id)) {
        const edge = edges.get(id);
        edge.classes.push('highlight');

        highlightDescendant(edge.targetId, nodes, edges);
    }
}

const actions = {};

export const LayoutStore = {
    namespaced: true,
    state: state,
    getters: getters,
    mutations: mutations,
    actions: actions
};
