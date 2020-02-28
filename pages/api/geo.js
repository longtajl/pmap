import worldgeo from '../../data/test.geo';

export default (req, res) => {
    let geoJson = worldgeo;
    res.status(200).json(geoJson);
}
