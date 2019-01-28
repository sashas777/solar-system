/** @class Solar.Planet */

atom.declare('Solar.Planet', App.Element, {

	angle: 0,
	roundTime: 0,
	speed: 0,
	speed2: 0,
	angleSpeed: 0,
	distance: 0,
	distance2: 0,
	g: 6.67408 * Math.pow(10, -11),
	sm: 1989000.00000*Math.pow(10,24),
	m0: 0,

	configure: function () {
		this.size = new Size(26, 26);

		//this.center = this.solarCenter.clone();
		this.center = new Point(this.settings.get('center_orbit_x'),this.settings.get('center_orbit_y'));
		this.center.move([ this.radius, 0 ]);

		this.shape = new Circle(this.center, this.size.width/2);

		this.image  = this.getImagePart();

		this.mousePoint = this.layer.app.resources.get('mouse').point;

		new App.Clickable( this, this.redraw ).start();

		//sashas
		this.movePlanet();

		this.rotate();


		this.info = new Solar.Info(this.layer, { planet: this, zIndex: 1 });
	},

	createOrbit: function (layer, z) {
		return this.orbit = new Solar.Orbit(layer, { planet: this, zIndex: z });
	},

	getImagePart: function () {
		var x = this.settings.get('image');

		return this.layer.app.resources.get('images')
			.get('planets')
			.sprite(new Rectangle([x*this.size.width,0],this.size));
	},

	get radius () {
		return this.settings.get('radius');
	},

	get solarCenter () {
		return this.settings.get('sun').shape.center;
	},

	rotate: function (angle) {
		if (angle == null) angle = (360).degree();

		this.angle = (this.angle + angle).normalizeAngle();
		//this.solarCenter.x = this.solarCenter.x +1;
		this.center.rotate(angle, this.solarCenter);

		return this;
	},

	checkStatus: function (visible) {
		if (this.info.isVisible() != visible) {
			this.info[visible ? 'show' : 'hide']();
			this.layer.dom.element.css('cursor', visible ? 'pointer' : 'default');
		}
	},

	onUpdate: function (time) {
		//this.rotate(time * (360).degree() / 1000 / this.settings.get('time'));

		//this.rotate((360).degree()/60 / this.settings.get('time'));
		//time - delta time

		//f2-f1=
// 		var l=Math.PI*(this.settings.get('a') + this.settings.get('b'));
// 		var v=2*Math.PI/(this.settings.get('periodEarth')/2);// round for 0.5 min
// 			//(this.settings.get('period')/24);// radian/min /24/3600; // radian/sec
// //1 day = 60 sec
// 		//365
// 		var deltaTime =  time/1000/60; // min
// 		var deltaAngle = v*deltaTime;

		this.roundTime+=time/1000;

		// var x0  = this.shape.center.x;
		// var y0  = this.shape.center.y;
		// var x = this.settings.get('center_orbit_x') + ((this.settings.get('a')) *Math.cos(this.angle));
		// var y = this.settings.get('center_orbit_y') + ((this.settings.get('b')) *Math.sin(this.angle));


		//Gravity

		var t =  24*900*time/1000;
		t = 86400*t;
		var Mt=this.calculateMt(this.m0, t);


		var e = this.settings.get('e');
		var a = this.settings.get('a')*149600000000;
		var w = this.settings.get('w');
		var i = this.settings.get('i');
		var omega = this.settings.get('omega');
		var sunX = this.settings.get('sun').shape.center.x;
		var sunY = this.settings.get('sun').shape.center.y;
		this.angle = Mt;
		Mt = Mt.normalizeAngle();
		this.m0 = Mt;

		var Et = this.newtonRaphson(function (E) {
			return E-e*Math.sin(E)-Mt;
		}, Mt);

		var Vt = this.getTrueAnomaly(Et);

		var rc=a*(1-e*Math.cos(Et))+50*(1.49597870691*Math.pow(10,11));
		var Oxt =rc*Math.cos(Vt);
		var Oyt =rc*Math.sin(Vt);
		var rtx = Oxt*(Math.cos(w)*Math.cos(omega) - Math.sin(w)*Math.cos(i)*Math.sin(omega)) - Oyt*(Math.sin(w)*Math.cos(omega) + Math.cos(w)*Math.cos(i)*Math.sin(omega));
		var rty = Oxt*(Math.cos(w)*Math.sin(omega) + Math.sin(w)*Math.cos(i)*Math.cos(omega)) - Oyt*(Math.cos(w)*Math.cos(i)*Math.cos(omega) - Math.sin(w)*Math.sin(omega));
		var rtz = Oxt*(Math.sin(w)*Math.sin(i)) + Oyt*(Math.cos(w)*Math.sin(i));
		var rtxAU = rtx/(1.49597870691*Math.pow(10,11));
		var rtyAU = rty/(1.49597870691*Math.pow(10,11));
		var rtzAU = rtz/(1.49597870691*Math.pow(10,11));

		x =sunX+rtxAU;
		y =sunY+rtyAU;
		if (this.settings.get('name')=='Mercury') {
			 //console.log(this.settings.get('name')+' rtzAU '+rtzAU);
		}

		//Gravity

		if (this.angle >= 2*Math.PI) {
			this.angle = 0;
			if (this.settings.get('name')=='Mercury') {
				//console.log(this.settings.get('name')+' round time '+this.roundTime);
				// console.log(this.settings.get('name')+' x '+x);
				// console.log(this.settings.get('name')+' y '+y);

				//console.log(' -------------- ');
			}
			this.roundTime=0;
		}




		this.shape.center.moveTo(
			{
				x : x,
				y : y
			}
		);
// //rotate itself
		//this.shape.center.rotate(  2*Math.PI/time*2, {x: this.shape.center.x, y: this.shape.center.y});

		this.redraw();

		if (this.orbit.isHover()) this.orbit.redraw();

		this.checkStatus(this.isTriggerPoint(this.mousePoint));
		if (this.info.isVisible()) this.info.updateShape(this.shape.center);
	},

	calculateDistanceAcceleration: function() {
		// [acceleration of distance] = [distance][angular velocity]^2 - G * M / [distance]^2
		return this.distance * Math.pow(this.speed, 2) -
			(this.g * this.sm) / Math.pow(this.distance, 2);
	},

	// Calculates a new value based on the time change and its derivative
	// For example, it calculates the new distance based on the distance derivative (velocity)
	// and the elapsed time interval.
	newValue: function(currentValue, deltaT, derivative) {
		return currentValue + deltaT * derivative;
	},

	calculateAngleAcceleration: function() {
		// [acceleration of angle] = - 2[speed][angular velocity] / [distance]
		return -2.0 * this.speed * this.angleSpeed / this.distance;
	},

	getDistance: function(x1, x2, y1, y2) {
		return Math.sqrt(Math.pow(Math.abs((x2-x1)),2) + Math.pow(Math.abs(y2-y1),2));
	},

	eccAnom: function(ec,m,dp) {

		// arguments:
		// ec=eccentricity, m=mean anomaly,
		// dp=number of decimal places

		var pi=Math.PI, K=pi/180.0;

		var maxIter=30, i=0;

		var delta=Math.pow(10,-dp);

		var E, F;

		m=m/360.0;

		m=2.0*pi*(m-Math.floor(m));

		if (ec<0.8) E=m; else E=pi;

		F = E - ec*Math.sin(m) - m;

		while ((Math.abs(F)>delta) && (i<maxIter)) {

			E = E - F/(1.0-ec*Math.cos(E));

			F = E - ec*Math.sin(E) - m;

			i = i + 1;

		}

		E=E/K;

		return Math.round(E*Math.pow(10,dp))/Math.pow(10,dp);

	},


	movePlanet: function(x =0, y=0) {
		//
		// if (x==0) {
		// 	x=this.settings.get('center_orbit_x')+this.settings.get('a');
		// }
		// if (y ==0 ) {
		// 	y=this.settings.get('center_orbit_y');
		// }
		 //var t=0;
		 //var Mt=this.calculateMt(this.settings.get('m'), t);
		 var Mt = this.settings.get('m');
		 this.m0=Mt;
		 var e = this.settings.get('e');
		 var a = this.settings.get('a')*149600000000;
		 var w = this.settings.get('w');
		 var i = this.settings.get('i');
		 var omega = this.settings.get('omega');
		 var sunX = this.settings.get('sun').shape.center.x;
		 var sunY = this.settings.get('sun').shape.center.y;

		 Mt = Mt.normalizeAngle();

		 var Et = this.newtonRaphson(function (E) {
			 return E-e*Math.sin(E)-Mt;
		 }, Mt);

		 var Vt = this.getTrueAnomaly(Et);

		 var rc=a*(1-e*Math.cos(Et));//+50*100*(1.49597870691*Math.pow(10,11));
		 var Oxt =rc*Math.cos(Vt);
		 var Oyt =rc*Math.sin(Vt);
		 var rtx = Oxt*(Math.cos(w)*Math.cos(omega) - Math.sin(w)*Math.cos(i)*Math.sin(omega)) - Oyt*(Math.sin(w)*Math.cos(omega) + Math.cos(w)*Math.cos(i)*Math.sin(omega));
		 var rty = Oxt*(Math.cos(w)*Math.sin(omega) + Math.sin(w)*Math.cos(i)*Math.cos(omega)) - Oyt*(Math.cos(w)*Math.cos(i)*Math.cos(omega) - Math.sin(w)*Math.sin(omega));
		 var rtxAU = rtx/(1.49597870691*Math.pow(10,11));
		 var rtyAU = rty/(1.49597870691*Math.pow(10,11));

		 x =sunX+rtxAU;
		 y =sunY+rtyAU;

		if (this.settings.get('name')=='Mercury') {
			console.log('Sun initial x: '+sunY);
			console.log('Sun initial y: '+sunX);
			console.log(' -------------- ');
			console.log(this.settings.get('name')+' initial x: '+x);
			console.log(this.settings.get('name')+' initial y: '+y);
			console.log(this.settings.get('name')+' initial Mt: '+Mt.normalizeAngle());
			console.log(this.settings.get('name')+' initial Et: '+Et);
			console.log(this.settings.get('name')+' initial Vt: '+Vt);
			console.log(this.settings.get('name')+' initial rtxAU: '+rtxAU);
			console.log(this.settings.get('name')+' initial rtyAU: '+rtyAU);
			console.log(this.settings.get('name')+' initial rtx: '+rtx);
			console.log(' -------------- ');
		}
		if (this.settings.get('name')=='Venus') {

			console.log(this.settings.get('name')+' initial x: '+x);
			console.log(this.settings.get('name')+' initial y: '+y);
			console.log(this.settings.get('name')+' initial Mt: '+Mt.normalizeAngle());
			console.log(this.settings.get('name')+' initial Et: '+Et);
			console.log(this.settings.get('name')+' initial Vt: '+Vt);
			console.log(this.settings.get('name')+' initial rtxAU: '+rtxAU);
			console.log(this.settings.get('name')+' initial rtyAU: '+rtyAU);
			console.log(' -------------- ');
		}


		this.shape.center.moveTo(
			{
				x : x,
				y : y
			}
		);

		this.distance = this.getDistance(sunX,x,sunY,y)*1149597870700*100+50;
		if (this.settings.get('name')=='Mercury') {
			console.log(this.settings.get('name')+' initial distance: '+this.getDistance(sunX,x,sunY,y));
		}

		this.angleSpeed = 1.990986 *  Math.pow(10, -7);//*24*3600/1149597870700/100; //m/s => aem/day
		//this.shape.center.rotate((1).degree(), {x: this.solarCenter.x, y: this.solarCenter.y});
	},

	calculateMt: function(m0, t) {
		var a = this.settings.get('a')*149600000000; //aem => meters
		var mu = 1.32712440041*Math.pow(10,20);//g*sm
		var Mt = m0 + t*(Math.sqrt( mu/Math.pow(a,3)));
		return Mt;
	},

	getTrueAnomaly: function(Et) {
		var e = this.settings.get('e')
		var x = Math.sqrt(1+e)*Math.sin(Et/2);
		var y = Math.sqrt(1-e)*Math.cos(Et/2);
		var Vt = 2*this.arctan2(x, y);
		return Vt;
	},

	arctan2: function(x,y) {
		var arcatn2;

		if (x>0) {
			arcatn2 = Math.atan(y/x);
		} else if (y>=0 && x <0) {
			arcatn2 = Math.atan(y/x) + Math.PI;
		} else if (y<0 && x <0) {
			arcatn2 = Math.atan(y/x) - Math.PI;
		} else if (y>0 && x==0) {
			arcatn2 =  Math.PI/2;
		} else if (y <0 && x==0) {
			arcatn2 =  -Math.PI/2;
		} else if (y==0 && x==0) {
			console.log('arctan2 undefined');
			return false;
		}
		return arcatn2;
	},

	renderTo: function (ctx) {
		ctx.drawImage({
			image : this.image,
			center: this.center,
			angle : this.angle
		});
	},

	newtonRaphson: function(f, fp, x0, options) {
		var x1, y, yp, tol, maxIter, iter, yph, ymh, yp2h, ym2h, h, hr, verbose, eps;

		// Iterpret variadic forms:
		if (typeof fp !== 'function') {
			options = x0;
			x0 = fp;
			fp = null;
		}

		options = options || {};
		tol = options.tolerance === undefined ? 1e-7 : options.tolerance;
		eps = options.epsilon === undefined ? 2.220446049250313e-16 : options.epsilon;
		maxIter = options.maxIterations === undefined ? 20 : options.maxIterations;
		h = options.h === undefined ? 1e-4 : options.h;
		verbose = options.verbose === undefined ? false : options.verbose;
		hr = 1 / h;

		iter = 0;
		while (iter++ < maxIter) {
			// Compute the value of the function:
			y = f(x0);

			if (fp) {
				yp = fp(x0);
			} else {
				// Needs numerical derivatives:
				yph = f(x0 + h);
				ymh = f(x0 - h);
				yp2h = f(x0 + 2 * h);
				ym2h = f(x0 - 2 * h);

				yp = ((ym2h - yp2h) + 8 * (yph - ymh)) * hr / 12;
			}

			// Check for badly conditioned update (extremely small first deriv relative to function):
			if (Math.abs(yp) <= eps * Math.abs(y)) {
				if (verbose) {
					console.log('Newton-Raphson: failed to converged due to nearly zero first derivative');
				}
				return false;
			}

			// Update the guess:
			x1 = x0 - y / yp;

			// Check for convergence:
			if (Math.abs(x1 - x0) <= tol * Math.abs(x1)) {
				if (verbose) {
					console.log('Newton-Raphson: converged to x = ' + x1 + ' after ' + iter + ' iterations');
				}
				return x1;
			}

			// Transfer update to the new guess:
			x0 = x1;
		}

		if (verbose) {
			console.log('Newton-Raphson: Maximum iterations reached (' + maxIter + ')');
		}

		return false;
	}

});
