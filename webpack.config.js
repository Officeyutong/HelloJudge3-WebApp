const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackTopBannerPlugin = require('html-webpack-top-banner-plugin');
module.exports = {
    plugins: [
        new HtmlWebpackPlugin(),
        new HtmlWebpackTopBannerPlugin(`<!--
        HelloJudge2, by MikuNotFoundException    
        -->`)
    ]
}