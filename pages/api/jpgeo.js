import jpgeo from '../../data/japan_geo'

export default (req, res) => {
    let geoJson = jpgeo;
    res.status(200).json(geoJson);
}
