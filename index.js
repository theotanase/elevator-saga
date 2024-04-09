{
    init:  (elevators, floors) => {
        const MAX_FLOORS_DIFF = floors.length + 1;
        const MAX_WAIT_MS_BETWEEN_BUTTONS = 100;

        let floorRequests = [];
        //
        const goToFloor = (elevator, destination, now) => {

            // Maybe go gradually
            elevator.goToFloor(destination, !!now);
        }
        //
        // const hasElevatorQueue = (elevator) => {
        //     return elevator.destinationQueue.length > 0;
        // }
        //
        // const removeFloorRequest = (floorReq) => {
        //     floorRequests = floorRequests.filter(r => r != floorReq);
        // }
        //
        // const goToClosestRequest = (elevator) => {
        //     if (hasElevatorQueue(elevator)) {
        //         return;
        //     }
        //
        //     const currentFloor = elevator.currentFloor();
        //
        //     let minDiff = 999999;
        //     let minDiffIndex = -1;
        //
        //
        //     for (let i = 0; i < floorRequests.length; i++) {
        //         req = floorRequests[i];
        //         const diff = Math.abs(req - currentFloor);
        //         if (diff < minDiff) {
        //             minDiff = diff;
        //             minDiffIndex = i;
        //         }
        //     }
        //
        //     if (minDiffIndex != -1) {
        //         const dest = floorRequests[minDiffIndex];
        //
        //         removeFloorRequest(dest);
        //
        //
        //         goToFloor(elevator, dest, true);
        //     }
        //
        // };
        //
        // const isBetween = (check, start, end) => {
        //     return (check > start && check < end) ||
        //
        //         (check > end && check < start );
        // }
        //
        // const goToPassengerRequest = (elevator, dest) => {
        //
        //     // Check if there are floor requests on the way.
        //     /*
        //     const currentFloor = elevator.currentFloor();
        //
        //     const sortedRequests = [...floorRequests].sort((r1, r2) => (r1 - r2) * ( currentFloor < dest ? 1 : -1));
        //
        //
        //     let nextDestination = dest;
        //
        //     for (const r of sortedRequests) {
        //         if (isBetween(r, currentFloor, dest)) {
        //             nextDestination = r;
        //             removeFloorRequest(r);
        //         }
        //     }
        //     */
        //
        //
        //     goToFloor(elevator, dest, true);
        // }
        //
        // const goToPressedFloors = (elevator) => {
        //     const pressedFloors = [ ...elevator.getPressedFloors()];
        //     if (!pressedFloors.length) {
        //         return;
        //     }
        //
        //     const sortedPressedFloors = pressedFloors.sort();
        //
        //     const minPressedFloor = sortedPressedFloors[0];
        //     const maxPressedFloor = sortedPressedFloors[sortedPressedFloors.length - 1];
        //     const currentFloor = elevator.currentFloor();
        //
        //     // Check if we are closer to the top or bottom;
        //     const diffToBottom = Math.abs(currentFloor - minPressedFloor);
        //     const diffToTop = Math.abs(currentFloor - maxPressedFloor);
        //
        //     let dest = currentFloor;
        //
        //     if (diffToBottom < diffToTop) {
        //         // going to the first lower than current
        //         for (let i = sortedPressedFloors.length - 1; i >= 0; i--) {
        //             const floor = sortedPressedFloors[i];
        //             if (floor < currentFloor) {
        //                 dest = floor;
        //                 break;
        //             }
        //         }
        //         if(dest === currentFloor) {
        //             dest = sortedPressedFloors[0];
        //         }
        //
        //     } else if (diffToTop < diffToBottom) {
        //         // going to the first higher than current
        //         for (let i = 0; i < sortedPressedFloors.length; i++) {
        //             const floor = sortedPressedFloors[i];
        //             if (floor > currentFloor) {
        //                 dest = floor;
        //                 break;
        //             }
        //         }
        //         if(dest === currentFloor) {
        //             dest = sortedPressedFloors[ sortedPressedFloors.length - 1];
        //         }
        //     } else {
        //         // diff equal, go to the closest one
        //
        //         let minDiff = 99999;
        //         let minDiffFloor = -1;
        //
        //         for (const pressed of sortedPressedFloors) {
        //             const diff = Math.abs(currentFloor, pressed);
        //             if (diff < minDiff) {
        //                 minDiff = diff;
        //                 minDiffFloor = pressed;
        //             }
        //         }
        //
        //         dest = minDiffFloor;
        //     }
        //
        //     goToPassengerRequest(elevator, dest);
        // };
        //
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

        const enqueueDestination = (elevator, floorNum) => {
            const queue = elevator.destinationQueue;
            if (!queue.includes(floorNum)) {
                goToFloor(elevator, floorNum);
            }

        }

        /**
         * Decide where to go next and ... go there
         *
         * TODO - consider button presses in order if waiting time is a thing
         */
        const setRoute = (elevator) => {
            // V1. go in order of the pressed buttons

            for (const button of elevator.getPressedFloors()) {
                enqueueDestination(elevator, button);
            }

        };

        const waitForAllButtonPressesThenGo = (elevator) => {
            clearButtonPressTimer(elevator);

            const index = getElevatorIndex(elevator);
            buttonPressedTimeouts[index] = setTimeout(() => {
                setRoute(elevator);

            }, MAX_WAIT_MS_BETWEEN_BUTTONS);
        }

        const removeFloorRequests = (floorNum) => {
            floorRequests = floorRequests.filter(r => r.floor != floorNum);
        }

        const goToFloorRequest = (elevator, floorNum) => {
            goToFloor(elevator, floorNum);

            removeFloorRequests(floorNum);
        }

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
        update
:
    (dt, elevators, floors) => {
        // We normally don't need to do anything here
    }
}
