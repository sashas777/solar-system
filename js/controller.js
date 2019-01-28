/** @class Solar.Controller */
atom.declare('Solar.Controller', {

	planets_num: 8,
	radius_multipler: 100,
	time_multiplier_sec: 30,
	distance_from_sun: 50,
	earth_t: 365.2564,

//1d = 30 sec
	//1aem * 100 = 1px
	planets: [
		{
			name: 'Mercury',
			speed: 87.97, //earth day=24 hours
			radius: 0.7232,//aem
			min_to_sun: 0.3074977523728, //aem
			max_to_sun: 0.4667007937567,  //aem
			e: 0.20563593,
			a: 0.38709927,
			m: 174.795884, // gradus
			mass: 0.32868*Math.pow(10,24), //kg
			w: 48.33167, //gradus
			omega: 48.33167	, //degree
			i: 7.005, //degree
		},
		{
			name: 'Venus',
			speed: 224.7, //earth day=24 hours
			radius: 0.3871,//aem
			min_to_sun: 0.7184338219327, //aem
			max_to_sun: 0.7282375042521,  //aem
			e: 0.00677323,
			a: 0.72333199,
			m: 50.12,
			mass: 4.81068*Math.pow(10,24),
			w: 76.68069, //gradus
			omega: 76.68069	,
			i: 3.3947, //degree
		},
		{
			name: 'Earth',
			speed: 365.2564, //earth day=24 hours
			radius: 1,//aem
			min_to_sun: 0.9832913417263, //aem
			max_to_sun: 1.0167138896316,  //aem
			e: 0.01671123,
			a: 1.00000261,
			m: 357.51716,
			mass: 5.9726*Math.pow(10,24),
			w: -11.26064, //gradus
			omega: -11.26064,
			i: 0, //degree
		},
		{
			name: 'Mars',
			speed: 686.6829, //earth day=24 hours
			radius: 1.5236,//aem
			min_to_sun: 1.3814047889386, //aem
			max_to_sun: 1.6660159053988,  //aem
			e: 0.0933941,
			a: 1.523662,
			m: 174.795884,
			mass: 0.63345*Math.pow(10,24),
			w: 49.57854, //gradus
			omega: 49.57854,
			i: 1.851, //degree
		},
		{
			name: 'Jupiter',
			speed: 1680.17944, //earth day=24 hours
			radius: 5.2028,//aem
			min_to_sun: 4.9511388867649, //aem
			max_to_sun: 5.45463517082,  //aem
			e: 0.048775,
			a: 5.204267,
			mass: 1876.64328*Math.pow(10,24),
			w: 100.55615, //gradus
			m: 174.795884,
			omega: 100.55615,
			i: 1.305, //degree
		},
	],



	initialize: function () {

		this.size = new Size(2000, 1010);

		this.app = new App({ size: this.size });

		this.orbitLayer = this.app.createLayer({
			name: 'orbit',
			intersection: 'manual',
			zIndex: 1
		});

		this.geoLayer = this.app.createLayer({
			name: 'geo',
			invoke: true,
			intersection: 'all',
			zIndex: 2
		});

		atom.ImagePreloader.run({
			planets: 'im/planets.png',
			sun    : 'im/sun.png'
		}, this.start.bind(this));
	},

	start: function (images) {
		var mouse, mouseHandler;

		mouse = new Mouse(this.app.container.bounds);
		mouseHandler = new App.MouseHandler({ mouse: mouse, app: this.app });

		this.app.resources.set({
			images: images,
			mouse : mouse,
			mouseHandler: mouseHandler
		});

		this.sun = new Solar.Sun(this.geoLayer, {
			shape: new Circle(this.app.rectangle.center, this.distance_from_sun)
		});

		for (var i = 0; i<this.planets.length; i++) {
			var planet_info = this.planets[i];

			var mintosun = planet_info.min_to_sun*this.radius_multipler+this.distance_from_sun;
			var maxtosun = planet_info.max_to_sun*this.radius_multipler+this.distance_from_sun;

			var aa = planet_info.a*this.radius_multipler*2;
			var a = aa/2;
			var b = a*Math.sqrt(1 - Math.pow(planet_info.e,2));
			// not sure what is this
			var ra = (1-planet_info.e)*aa;
			var rp = (1+planet_info.e)*aa;
			//not used?
			var c=a*planet_info.e;


			var x1=this.app.rectangle.center.x-mintosun;
			var x2=this.app.rectangle.center.x+maxtosun;
			var y1=this.app.rectangle.center.y-b;
			var y2=this.app.rectangle.center.y+b;
			var center_orbit_x = (x1+x2)/2;
			var center_orbit_y = (y1+y2)/2;

			var planet = new Solar.Planet(this.geoLayer, {
				sun   : this.sun,
				radius: this.distance_from_sun+planet_info.radius*this.radius_multipler,
				period  : planet_info.speed,///this.time_multiplier_sec,
				periodEarth  : planet_info.speed/this.earth_t,///this.time_multiplier_sec,
				image : i,
				zIndex: 0,
				name  : planet_info.name,
				min_to_sun  : mintosun,
				max_to_sun  : maxtosun,
				e  : planet_info.e,
				aa  : aa,
				a   : a,
				b  : b,
				c  : c,
				center_orbit_x: center_orbit_x,
				center_orbit_y: center_orbit_y,
				m: planet_info.m,
				mass: planet_info.mass,
				w: planet_info.w,
				omega: planet_info.omega,
				i: planet_info.i,
			});

			 planet.createOrbit(this.orbitLayer, i);
			mouseHandler.subscribe( planet );
			mouseHandler.subscribe( planet.orbit );
		}
	}
});