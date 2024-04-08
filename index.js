{
    init: function(elevators, floors) {
        
        let floorRequests = [];
        
        const goToFloor = (elevator, destination, now) => {
            
            // Maybe go gradually
            elevator.goToFloor(destination, !!now);
        }
        
        const hasElevatorQueue = (elevator) => {
            return elevator.destinationQueue.length > 0;
        }
        
        const removeFloorRequest = (floorReq) => {
            floorRequests = floorRequests.filter(r => r != floorReq);
        }
        
        const goToClosestRequest = (elevator) => {
            if (hasElevatorQueue(elevator)) {
                return;
            }
            
            const currentFloor = elevator.currentFloor();
            
            let minDiff = 999999;
            let minDiffIndex = -1;
            
            
            for (let i = 0; i < floorRequests.length; i++) {
                req = floorRequests[i];
                const diff = Math.abs(req - currentFloor);
                if (diff < minDiff) {
                    minDiff = diff;
                    minDiffIndex = i;
                }
            }
            
            if (minDiffIndex != -1) {
                const dest = floorRequests[minDiffIndex];
                
                removeFloorRequest(dest);
                
               
                goToFloor(elevator, dest, true);
            }
            
        };
        
        const isBetween = (check, start, end) => {
            return (check > start && check < end) ||
                
                (check > end && check < start );
        }
        
        const goToPassengerRequest = (elevator, dest) => {
            
            // Check if there are floor requests on the way.
            /*
            const currentFloor = elevator.currentFloor();
            
            const sortedRequests = [...floorRequests].sort((r1, r2) => (r1 - r2) * ( currentFloor < dest ? 1 : -1));
            
            
            let nextDestination = dest;
            
            for (const r of sortedRequests) {
                if (isBetween(r, currentFloor, dest)) {
                    nextDestination = r;
                    removeFloorRequest(r);
                }
            }
            */
            
            
            goToFloor(elevator, dest, true);
        }
        
        const goToPressedFloors = (elevator) => {
            const pressedFloors = [ ...elevator.getPressedFloors()];
            if (!pressedFloors.length) {
                return;
            }
            
            const sortedPressedFloors = pressedFloors.sort();
            
            const minPressedFloor = sortedPressedFloors[0];
            const maxPressedFloor = sortedPressedFloors[sortedPressedFloors.length - 1];
            const currentFloor = elevator.currentFloor();
           
            // Check if we are closer to the top or bottom;
            const diffToBottom = Math.abs(currentFloor - minPressedFloor);
            const diffToTop = Math.abs(currentFloor - maxPressedFloor);
            
            let dest = currentFloor;
            
            if (diffToBottom < diffToTop) {
                // going to the first lower than current
                for (let i = sortedPressedFloors.length - 1; i >= 0; i--) {
                    const floor = sortedPressedFloors[i];
                    if (floor < currentFloor) {
                        dest = floor;
                        break;
                    }
                }
                if(dest === currentFloor) {
                    dest = sortedPressedFloors[0];
                }
                
            } else if (diffToTop < diffToBottom) {
                // going to the first higher than current
                for (let i = 0; i < sortedPressedFloors.length; i++) {
                    const floor = sortedPressedFloors[i];
                    if (floor > currentFloor) {
                        dest = floor;
                        break;
                    }
                }
                if(dest === currentFloor) {
                    dest = sortedPressedFloors[ sortedPressedFloors.length - 1];
                }
            } else {
                // diff equal, go to the closest one
                
                let minDiff = 99999;
                let minDiffFloor = -1;
                
                for (const pressed of sortedPressedFloors) {
                    const diff = Math.abs(currentFloor, pressed);
                    if (diff < minDiff) {
                        minDiff = diff;
                        minDiffFloor = pressed;
                    }
                }
                
                dest = minDiffFloor;
            }
            
            goToPassengerRequest(elevator, dest);
        };
        
        const isStopped = (elevator) => {
            return elevator.destinationDirection() == 'stopped';
        };
        
        const hasButtonRequests = (elevator) => {
            return elevator.getPressedFloors().length > 0;
        };
        
        const goToNextJob = (elevator) => {
            
            
            if (isStopped(elevator) && hasButtonRequests(elevator)) {
                return goToPressedFloors(elevator);
            } else {
                return goToClosestRequest(elevator);
            }
        };
      

        const setupElevator = (elevator) => {
            // Whenever the elevator is idle (has no more queued destinations) ...
            elevator.on("idle", function() {
                goToNextJob(elevator);
            }); 

            elevator.on("floor_button_pressed", function(floorNum) {
                goToNextJob(elevator);
                
            });
        };
        
        const isIdle = (elevator) => {
            return isStopped(elevator) && !hasButtonRequests(elevator)
        }
        
        const getFirstIdleElevator = () => {
            for (const elevator of elevators) {
                if(isIdle(elevator)) {
                    return elevator;
                }
            }
            
            // TODO
            return null;
        }
        
        const addFloorRequest = (num) => {
            floorRequests.push(num);
            
            const firstIdleElevator = getFirstIdleElevator();
            if (firstIdleElevator) {
                goToNextJob(firstIdleElevator);
            }
           
            
        }
        
        const setupFloor = (floor) => {
            floor.on("up_button_pressed", function() {
                addFloorRequest(floor.floorNum());
            });
            
            floor.on("down_button_pressed", function() {
                addFloorRequest(floor.floorNum());
            });
        }
        
        for (const floor of floors) {
            setupFloor(floor);
        }
        
        for (const elevator of elevators) {
            setupElevator(elevator)
        }
        
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}
