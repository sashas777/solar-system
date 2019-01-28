/** @class Solar.Orbit */
atom.declare('Solar.Orbit', App.Element, {

	e_earth: 0.01671123,

	configure: function () {
		this.shape = new Circle(this.planet.solarCenter, this.planet.radius);

		this.shape = new Ellipse(
			{
				from: [
					this.planet.settings.get('center_orbit_x')-this.planet.settings.get('a'),
					this.planet.settings.get('center_orbit_y')-this.planet.settings.get('b')
				],
				to: [
					this.planet.settings.get('center_orbit_x')+this.planet.settings.get('a'),
					this.planet.settings.get('center_orbit_y')+this.planet.settings.get('b')
				]
			}
			); //x,y
		this.center_orbit = new Circle(new Point(this.planet.settings.get('center_orbit_x'), this.planet.settings.get('center_orbit_y')), 2);

		new App.Clickable( this, this.redraw ).start();
	},

	get planet () {
		return this.settings.get('planet');
	},

	isTriggerPoint: function (point) {
		var distance = this.planet.solarCenter.distanceTo(point);

		return (this.planet.radius - distance).abs() < 13;
	},

	isHover: function () {
		return this.hover || this.planet.hover;
	},

	clearPrevious: function (ctx) {
		if (this.previousBoundingShape) {
			ctx.save();
			ctx.set({ lineWidth: 4 });
			ctx.clear(this.previousBoundingShape);
			ctx.clear(this.shape, true);
			ctx.clear(this.center_orbit, true);
			ctx.restore();
		} else {
			ctx.clear(this.shape, true);
			ctx.clear(this.center_orbit, true);
		}
	},

	saveCurrentBoundingShape: function () {
		if (this.isHover()) {
			this.previousBoundingShape = this.planet.shape.clone().grow(6);
		} else {
			this.previousBoundingShape = null;
		}
		return this;
	},

	renderTo: function (ctx, resources) {
		if (this.isHover()) {
			ctx.save();
			ctx.set({strokeStyle: 'rgb(0,192,255)', lineWidth: 3 });

			ctx.stroke(this.shape);
			ctx.clear(this.planet.shape);
			ctx.stroke(this.planet.shape);

			ctx.stroke(this.center_orbit);
			ctx.clear(this.center_orbit);
			ctx.stroke(this.center_orbit);

			ctx.restore();
		} else {
			ctx.stroke(this.shape, 'rgba(0,192,255,0.5)');
			ctx.stroke(this.center_orbit, 'rgba(0,192,255,0.5)');
		}


	}

});