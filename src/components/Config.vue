<template>
    <div class="content"
         v-if="isShow">
        <div>
            <div>Configuration</div>
            <button @click="onClick">{{buttonText}}</button>
        </div>
        <ul :class="isOpen ? 'open' : 'close'">
            <li>Project : {{projectName}}</li>
            <li>Max generation : {{config.maxGeneration}}</li>
            <li>Mutation generating count : {{config.mutationGeneratingCount}}</li>
            <li>Crossover generating count : {{config.crossoverGeneratingCount}}</li>
            <li>Headcount : {{config.headcount}}</li>
            <li>Random seed : {{config.randomSeed}}</li>
        </ul>
    </div>
</template>

<script lang="ts">
    import {Component, Vue} from "vue-property-decorator";
    import {APRConfiguration} from "../scripts/json/APRConfiguration";

    @Component
    export default class Config extends Vue {

        public isOpen: boolean = false;

        public get buttonText(): string {
            return (this.isOpen) ? 'Close' : 'Open';
        }

        public get isShow() {
            return this.$store.getters['VariantStore/config'] !== undefined;
        }

        public get config(): APRConfiguration {
            return this.$store.getters['VariantStore/config'];
        }

        public get projectName(): string {
            return this.$store.getters['VariantStore/projectName'];
        }

        public onClick() {
            this.isOpen = !this.isOpen;
        }
    }
</script>

<style scoped lang="scss">
    .content {
        ul {
            margin: 0;
        }

        div {
            display: flex;
        }
    }

    .open {

    }

    .close {
        display: none;
    }

</style>
