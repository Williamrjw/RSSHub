const got = require('@/utils/got');
const cheerio = require('cheerio');
const dayjs = require('dayjs');
const _ = require('lodash');

// 感谢天津学院提供模板

const baseUrl = 'https://sd.ustb.edu.cn';
const maps = {
    tzgg: '/tzgg/index.htm', // 顺德通知公告
};

function getNews(data) {
    const $ = cheerio.load(data);
    const items = $('div[class="news_list"] ul li');
    return items
        .map((_, item) => ({
            link: baseUrl + '/' + 'tzgg' + '/' + item.children[2].attribs.href, // 待改进，href中不包括tzgg文件夹
            title: item.children[2].children[0].data,
            pubDate: dayjs(item.children[0].children[0].data + ' 8:00').toString(), // 转化时间为当日8：00以适应东八区
        }))
        .get();
}

module.exports = async (ctx) => {
    let type = ctx.params.type || 'all';
    if (!_.includes(_.keys(maps), type)) {
        type = 'all';
    }

    const responseData = {
        title: '北京科技大学顺德研究生院通知公告',
        link: baseUrl,
        item: null,
    };

    if (type === 'all') {
        const all = await Promise.all(
            Object.values(maps).map(async (link) => {
                const response = await got.get(baseUrl + link);
                const news = getNews(response.data);
                return Promise.resolve(news);
            })
        );
        responseData.item = _.orderBy(_.flatMapDepth(all), (res) => new Date(res.pubDate), ['desc']);
    } else {
        const response = await got.get(baseUrl + maps[type]);
        const news = getNews(response.data);
        responseData.item = news;
    }

    ctx.state.data = responseData;
};
