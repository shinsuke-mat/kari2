<template>
    <div class="diff-list-wrapper" v-if="variantId !== ''">
        <button @click="onClick">Close</button>
        <!--<div>-->
            <!--<p>Generation Number : {{getGenerationNumber}}</p>-->
            <!--<p>Fitness : {{getFitness}}</p>-->
        <!--</div>-->
        <div v-html="prettyHtml"></div>
    </div>
</template>

<script>
    import {Diff2Html} from "diff2html";
    import "diff2html/dist/diff2html.min.css";

    export default {
        props: {
            variantId: {
                type: Number,
                required: true
            }
        },
        computed: {
            prettyHtml: function () {
                return Diff2Html.getPrettyHtml(this.getDiffs,
                    {
                        inputFormat: "diff",
                        showFiles: true,
                        matching: "lines",
                        outputFormat: this.outputFormat
                    });
            },
            outputFormat: function () {
                return 'side-by-side';
            },
            getDiffs: function () {
                const variant = this.$store.getters['VariantStore/variant'](this.variantId);
                const patch = variant.patch;

                if (patch === undefined) {
                    return '';
                }

                const size = patch.length;

                let diff = '';
                for (let i = 0; i < size - 1; i++) {
                    diff += patch[i].diff + '\n';
                    console.log(diff);
                }
                diff += patch[size - 1].diff;

                return diff;
            },
            getGenerationNumber: function () {
                const variant = this.$store.getters['VariantStore/variant'](this.variantId);
                return variant.getGenerationNumber();
            },
            getFitness: function () {
                const variant = this.$store.getters['VariantStore/variant'](this.variantId);
                return variant.getFitness();
            }
        },
        methods: {
            onClick: function () {
                this.$store.commit('DiffStore/reset', {});
                this.$store.commit('LayoutStore/clearNodeClass', {});
                this.$store.commit('LayoutStore/clearEdgeClass', {});
            }
        }
    }
</script>

<style scoped>
    .diff-list-wrapper {
        position: relative;
        border: gray solid 2px;
        margin-top: 5px;
        margin-bottom: 5px;
    }
</style>
