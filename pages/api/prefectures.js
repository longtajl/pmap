import prefectures from '../../data/prefectures';

export default (req, res) => {
    let prefecturesJson = prefectures.map((p) => {
        p.count = Math.floor(Math.random() * 10);
        return p;
    });
    res.status(200).json(prefecturesJson)
}
