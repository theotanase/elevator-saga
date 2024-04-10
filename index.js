{
    init:  (elevators, floors) => {
        const MAX_FLOORS_DIFF = floors.length + 1;
        const MAX_WAIT_MS_BETWEEN_BUTTONS = 100;

        let floorRequests = [];

        const updateLights = (elevator) => {
            const currentFloor = elevator.currentFloor();
            const destinationQueue = elevator.destinationQueue;
            if (destinationQueue.length === 0) {
                elevator.goingUpIndicator(true);
                elevator.goingDownIndicator(true);
                return;
            }

            const nextFloor = destinationQueue[0];
            if (nextFloor > currentFloor) {
                elevator.goingUpIndicator(true);
                elevator.goingDownIndicator(false);
            } else if (nextFloor < currentFloor) {
                elevator.goingUpIndicator(false);
                elevator.goingDownIndicator(true);
            } else {
                elevator.goingUpIndicator(true);
                elevator.goingDownIndicator(true);
            }
        }

        const goToFloor = (elevator, destination, now) => {

            // Maybe go gradually
            elevator.goToFloor(destination, !!now);
            updateLights(elevator);
        }

        const isStopped = (elevator) => {
            return elevator.destinationDirection() == 'stopped';
        };

        const buttonPressedTimeouts = elevators.map(e => null);

        const getElevatorIndex = (elevator) => {
            return elevators.indexOf(elevator);
        }

        const clearButtonPressTimer = (elevator) => {
            const index = getElevatorIndex(elevator);
            clearTimeout(buttonPressedTimeouts[index]);
            buttonPressedTimeouts[index] = null;
        }

        const getRoute = (elevator) => {

            // V2. optimize route - triangle
            const pressedFloors = [...elevator.getPressedFloors()];
            if (!pressedFloors.length) {
                return;
            }

            const currentFloor = elevator.currentFloor();

            const sortedAscending = pressedFloors.sort((a, b) => a - b);
            const lowestDestination = sortedAscending[0];
            const highestDestination = sortedAscending[sortedAscending.length - 1];

            // If all pressed floors are above, we go up in order
            if (currentFloor <= lowestDestination) {
                return [...sortedAscending];
            }

            // If all pressed floors are below, we go down in order
            if (currentFloor >= highestDestination) {
                return [...sortedAscending].reverse();
            }

            // We are in the middle, we decide if we go up or down
            const lowerThanCurrentDescending = sortedAscending.filter(f => f <= currentFloor).reverse();
            const higherThanCurrent = sortedAscending.filter(f => f > currentFloor);

            // We go down first
            if (Math.abs(currentFloor - lowestDestination) < Math.abs(currentFloor - highestDestination)) {
                return [...lowerThanCurrentDescending, ...higherThanCurrent];
            }

            // We go up first
            return [...higherThanCurrent, ...lowerThanCurrentDescending];
        }

        /**
         * Decide where to go next and ... go there
         *
         * TODO - consider button presses in order if waiting time is a thing
         */
        const decideRoute = (elevator) => {

            const route = getRoute(elevator);

            elevator.destinationQueue = route;
            elevator.checkDestinationQueue();
            updateLights(elevator);
        };

        const waitForAllButtonPressesThenGo = (elevator) => {
            clearButtonPressTimer(elevator);

            const index = getElevatorIndex(elevator);
            buttonPressedTimeouts[index] = setTimeout(() => {
                decideRoute(elevator);

            }, MAX_WAIT_MS_BETWEEN_BUTTONS);
        }

        const removeFloorRequests = (floorNum) => {
            floorRequests = floorRequests.filter(r => r.floor != floorNum);
        }

        const goToFloorRequest = (elevator, floorNum) => {
            goToFloor(elevator, floorNum);

            removeFloorRequests(floorNum);
        }

        /**
         * Get first request in queue for minimizing the MAX waiting time.
         *
         * Get the closest request in queue for minimizing AVERAGE waiting time.
         * @param elevator
         */
        const checkForNextJob = (elevator) => {
            if (!isIdle(elevator)) {
                return;
            }

            if (floorRequests.length > 0) {
                const nextFloor = floorRequests[0].floor;

                goToFloorRequest(elevator, nextFloor);
            }
        };

        const isEmpty = (elevator) => {
            return elevator.loadFactor() === 0;
        }

        const isIdle = (elevator) => {
            return isStopped(elevator) && isEmpty(elevator)
                && elevator.destinationQueue.length === 0;
        }

        const getClosestIdleElevator = (targetFloor) => {
            let minDiff = MAX_FLOORS_DIFF
            let closestIdleElevator = null;

            for (const elevator of elevators) {
                if (isIdle(elevator)) {

                    const diff = Math.abs(elevator.currentFloor() - targetFloor);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closestIdleElevator = elevator;
                    }
                }
            }

            return closestIdleElevator;
        }


        const addFloorRequest = (num, direction) => {
            floorRequests.push({
                floor: num,
                direction
            });

            const firstIdleElevator = getClosestIdleElevator(num);
            if (firstIdleElevator) {
                goToFloorRequest(firstIdleElevator, num);
            }
        }

        /**
         * Clear the requests that match the elevators direction lights
         *
         * @param elevator
         * @param floorNum
         */
        const clearRequestsForFloor = (elevator, floorNum) => {
            if (elevator.goingUpIndicator()) {
                floorRequests = floorRequests.filter(r => r.floor != floorNum || r.direction !== 'up');
            }
            if (elevator.goingDownIndicator()) {
                floorRequests = floorRequests.filter(r => r.floor != floorNum || r.direction !== 'down');
            }
        }

        const setupFloor = (floor) => {
            floor.on("up_button_pressed", function () {
                addFloorRequest(floor.floorNum(), 'up');
            });

            floor.on("down_button_pressed", function () {
                addFloorRequest(floor.floorNum(), 'down');
            });
        }

        const setupElevator = (elevator) => {
            // Whenever the elevator is idle (has no more queued destinations) ...
            elevator.on("idle", function () {
                checkForNextJob(elevator);
            });

            elevator.on("floor_button_pressed", function (floorNum) {
                waitForAllButtonPressesThenGo(elevator);
            });

            elevator.on("stopped_at_floor", function (floorNum) {
                updateLights(elevator);
                clearRequestsForFloor(elevator, floorNum);
            });
        };

        for (const floor of floors) {
            setupFloor(floor);
        }

        for (const elevator of elevators) {
            setupElevator(elevator)
        }


    },
        update: (dt, elevators, floors) => {
        // We normally don't need to do anything here
    }
}
