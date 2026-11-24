# Franklin 的个人主页

这是 Franklin 的个人主页。网站由 GitHub Pages 从 `main` 分支发布。

[打开个人主页](https://franklin3366.github.io/)

## 编辑页面内容

登录 GitHub 后打开对应的编辑页。把愿意公开的内容写入数据文件，然后点 **Commit changes…** 提交到 `main`。GitHub Pages 发布后会在网页上显示新内容。

| 页面 | 数据文件 | 填写字段 |
| --- | --- | --- |
| 旅行地图 | [编辑旅行记录](https://github.com/franklin3366/franklin3366.github.io/edit/main/data/places.json) | `name` 地点、`country` 国家或地区、`lat` 纬度、`lng` 经度。`visited` 到访日期和 `note` 备注可选。 |
| 项目 | [编辑项目](https://github.com/franklin3366/franklin3366.github.io/edit/main/data/projects.json) | `title` 项目名。`summary` 简介、`period` 时间、`url` 项目网址和 `repository` 源码网址可选。 |
| 工作经历 | [编辑工作经历](https://github.com/franklin3366/franklin3366.github.io/edit/main/data/experience.json) | `organization` 公司或组织、`role` 岗位。`start` 开始时间、`end` 结束时间和 `summary` 工作内容可选。 |
| 生活记录 | [编辑生活记录](https://github.com/franklin3366/franklin3366.github.io/edit/main/data/journal.json) | 在 `food` 好吃的、`activities` 好玩的或 `sights` 好看的对应列表中加入记录。`title` 是名称，`place` 地点、`date` 日期、`note` 备注和 `url` 相关网址可选。 |

项目、工作经历和生活记录每条使用一对花括号，相邻条目用逗号分开。工作经历和生活记录推荐使用 `YYYY-MM` 或 `YYYY-MM-DD`，便于按日期排序。工作经历填了 `start` 并留空 `end` 时显示「至今」。

## 添加旅行记录

下面是填写示例。把地点和坐标替换成自己的旅行记录。有多条记录时，在相邻的 `}` 和 `{` 之间加逗号。

```json
[
  {
    "name": "京都",
    "country": "日本",
    "lat": 35.0116,
    "lng": 135.7681,
    "visited": "2025-04",
    "note": "沿着鸭川散步。"
  }
]
```

`visited` 支持 `YYYY-MM` 和 `YYYY-MM-DD`。`lat`、`lng` 填数字，可以用城市中心坐标。旅行地图和仓库文件都是公开内容。希望自己留存的行程、照片和备注可以放在单独的私有仓库里。

## 本地预览

在项目目录运行 `python3 -m http.server 8000`，再用浏览器打开 `http://localhost:8000/`。

底图使用 Natural Earth 的 1:110m 陆地数据。数据为公有领域。[数据来源及使用条款](https://www.naturalearthdata.com/about/terms-of-use/)
