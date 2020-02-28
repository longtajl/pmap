import prefectures from '../../data/prefectures';

export default (req, res) => {
    let prefecturesJson = prefectures.map((p) => {
        p.count = getCount(p.id);
        return p;
    });
    res.status(200).json(prefecturesJson)
}

function getCount(prefectureId) {
    return {
         1: 54,
         2: 0,
         3: 0,
         4: 0,
         5: 0,
         6: 0,
         7: 0,
         8: 0,
         9: 1,
        10: 0,
        11: 4,
        12: 12,
        13: 36,
        14: 21,
        15: 0,
        16: 0,
        17: 4,
        18: 0,
        19: 0,
        20: 2,
        21: 2,
        22: 0,
        23: 27,
        24: 1,
        25: 0,
        26: 2,
        27: 2,
        28: 0,
        29: 1,
        30: 1,
        31: 0,
        32: 0,
        33: 0,
        34: 0,
        35: 0,
        36: 1,
        37: 0,
        38: 0,
        39: 0,
        40: 2,
        41: 0,
        42: 0,
        43: 5,
        44: 0,
        45: 0,
        46: 0,
        47: 3
    }[prefectureId]
}
