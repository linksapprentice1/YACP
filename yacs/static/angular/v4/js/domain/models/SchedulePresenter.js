'use strict';

(function(angular, app, undefined){

app.factory('schedulePresenter', function($q, Time, CourseFetcher, Utils){
	var weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
	var weekend = ['Saturday', 'Sunday'];

	function weekdaysOrFullWeek(schedules){
		var dows = _(schedules).chain().map(function(schedule){
			return _(schedule).chain().map(function(section){
				return _.pluck(section.section_times, 'days_of_the_week');
			}).flatten();
		}).flatten().uniq().value();
		if (_.include(dows, 'Saturday') || _.include(dows, 'Sunday')){
			return _.union(weekdays, weekend);
		} else {
			return weekdays;
		}
	}

	function computeTimeRange(schedules){
		var minTime, maxTime;

		_.each(schedules, function(schedule){
			_.each(schedule, function(section){
				_.each(section.section_times, function(section_time){
					var startInSeconds = section_time.startTimeInSeconds();
					var endInSeconds = section_time.endTimeInSeconds();
					if (!minTime || minTime.totalSeconds > startInSeconds) {
						minTime = section_time.start_time;
					}
					if (!maxTime || maxTime.totalSeconds < endInSeconds) {
						maxTime = section_time.end_time;
					}
				});
			});
		});

		return _(_.range(minTime.hour - 1, maxTime.hour + 2)).chain().map(function(hour){
			return [new Time(hour), new Time(hour, 30)];
		}).flatten().value();
	}

	function computeTimeSlots(schedule, firstHour, idToCourse){
		var result = {};
		function overlappingSections(){
			var week = {};
			_.each(schedule, function(section){
				_.each(section.days_of_the_week, function(dow){
					week[dow] = week[dow] || [];
					week[dow].push(section);
				});
			});

			_.each(week, function(sections, dow){
				var groups = [];
				_.each(sections, function(section){
					var merged = false;
					_.any(groups, function(group){
					});
				});
			});
		}

		function fill(section, section_time){
			var startHour = section_time.start_time.hour;
			var seconds = section_time.end_time.totalSeconds - section_time.start_time.totalSeconds;
			_.each(section_time.days_of_the_week, function(dow){
				result[dow] = result[dow] || [];
				result[dow].push({
					course: idToCourse[section.course_id],
					section: section,
					offsetInHours: startHour - (firstHour || 0),
					heightInSeconds: seconds,
					section_time: section_time
				});
			});
		}

		_.each(schedule, function(section){
			_.each(section.section_times, function(section_time){
				fill(section, section_time);
			});
		});

		return result;
	}

	return function(schedulesPromise){
		var deferred = $q.defer();
		schedulesPromise.then(function(schedules){
			if (!schedules.length) {
				deferred.resolve([]);
				return;
			}
			var courseIds = _(schedules).chain().map(function(schedule){
				return _.keys(schedule);
			}).flatten().uniq().value();
			var coursesPromise = CourseFetcher({course_id: courseIds});
			coursesPromise.then(function(courses){
				var idToCourse = Utils.hashById(courses);

				var dows = weekdaysOrFullWeek(schedules);
				var timeRange = computeTimeRange(schedules);
				var result = _.map(schedules, function(schedule){
					return {
						crns: _(schedule).chain().values().pluck('crn').value().join(', '),
						dows: dows,
						time_range: timeRange,
						blocks: computeTimeSlots(schedule, timeRange[0].hour, idToCourse)
					};
				});

				deferred.resolve(result);
			});
		});

		return deferred.promise;
	};
});

})(angular, app);
