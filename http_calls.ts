import * as https from "https";
import { plot, Plot } from 'nodeplotlib';

const BASE_URL = "https://gorest.co.in/";

function getUserDataCallback(userID: number, callback: (error?: Error, data?: object) => void) {
    const req = https.get(BASE_URL + "public/v1/users/" + userID.toString(), (res: any) => {
        let responseData = "";
        res.on('data', (d: any) => {
            responseData = responseData + d;
        });
        res.on("close", () => {
            callback(undefined, JSON.parse(responseData));
        })
    }).on('error', (e:Error) => {
        callback(e, undefined);
    });
}

function getUserDataPromise(userID: number) {
    return new Promise((resolve, reject) => {
        getUserDataCallback(userID, (error, data) => {
            if (error != undefined) {
                reject(error);
            } else {
                resolve(data);
            }
        })
    })
}

function load3UsersWithCallbacksNested() {
    const startTime = new Date().getTime();
    getUserDataCallback(100, (error, data) => {
        getUserDataCallback(100, (error, data) => {
            getUserDataCallback(100, (error, data) => {
                const timeDiff = new Date().getTime() - startTime;
                console.log("loading 3 users with nested callbacks took: ", timeDiff/1000, "sec");
            })
        })
    })
}

function loadUsersWithCallbacksNested(numLeft: number, callback: (error: boolean) => void): void {
    const startTime = new Date().getTime();
    if (numLeft == 0) {
        callback(false);
    } else {
        getUserDataCallback(100, (error, data) => {
            if (error) {
                callback(true);
            } else {
                loadUsersWithCallbacksNested(numLeft - 1, (err: boolean) => {
                    callback(err);
                })
            }
        })
    }
}

function executeNestedCallbackLoad(num: number) {
    const startTime = new Date().getTime();
    loadUsersWithCallbacksNested(num, (err) => {
        const timeDiff = new Date().getTime() - startTime;
        console.log("Nested Load of ", num, " users took ", timeDiff/1000, "sec");
    })
}

function load3UsersWithCallbacksAtOnce() {
    const startTime = new Date().getTime();
    let count = 0;
    getUserDataCallback(100, (error, data) => {
        if (count == 2) {
            const timeDiff = new Date().getTime() - startTime;
            console.log("loading 3 users with nested callbacks took: ", timeDiff/1000, "sec");
        } else {
            count = count + 1;
        }
    });
    getUserDataCallback(100, (error, data) => {
        if (count == 2) {
            const timeDiff = new Date().getTime() - startTime;
            console.log("loading 3 users with nested callbacks took: ", timeDiff/1000, "sec");
        } else {
            count = count + 1;
        }
    });
    getUserDataCallback(100, (error, data) => {
        if (count == 2) {
            const timeDiff = new Date().getTime() - startTime;
            console.log("loading 3 users with nested callbacks took: ", timeDiff/1000, "sec");
        } else {
            count = count + 1;
        }
    });
}

function loadUsersWithCallbacksAtOnce(count: number) {
    const startTime = new Date().getTime();
    let numDone = 0;
    for (let i=0; i < count; i++) {
        getUserDataCallback(100, (error, data) => {
            if (numDone == count - 1) {
                const timeDiff = new Date().getTime() - startTime;
                console.log("loading ", count, " users with nested callbacks took: ", timeDiff/1000, "sec");
            } else {
                numDone = numDone + 1;
            }
        });
    }
}

async function loadUserDataAsyncOneByOne(num: number): Promise<Error | undefined> {
    const startTime = new Date().getTime();
    try {
        for (let i=0; i < num; i++) {
            await getUserDataPromise(100);
        }
        const timeDiff = new Date().getTime() - startTime;
        console.log("loading ", num, " users blocking with async keyword took", timeDiff/1000, "sec");
        return;
    } catch(e) {
        return e;
    }
}

async function loadUserDataAsyncBulk(num: number): Promise<Error | undefined> {
    try {
        const startTime = new Date().getTime();
        const promiseStack = [];
        for (let i=0; i < num; i++) {
            promiseStack.push(getUserDataPromise(100));
        }
        const err = await Promise.all(promiseStack);
        const timeDiff = new Date().getTime() - startTime;
        console.log("loading ", num, " users blocking with async keyword took", timeDiff/1000, "sec");
        return;
    } catch(e) {
        return e;
    }
}
//executeNestedCallbackLoad(50);
//loadUsersWithCallbacksAtOnce(100);
//loadUserDataAsyncBulk(100);

async function createGraphs() {
    const blockedNumbers = [];
    const blockedTimes = [];
    for(let i= 1; i < 50; i = i+5) {
        const startTime = new Date().getTime();
        await loadUserDataAsyncOneByOne(i);
        const timeTaken = new Date().getTime() - startTime;
        blockedNumbers.push(i);
        blockedTimes.push(timeTaken/1000);
    }

    const bulkNumbers = [];
    const bulkTimes = [];
    for(let i= 1; i < 50; i = i+5) {
        const startTime = new Date().getTime();
        await loadUserDataAsyncBulk(i);
        const timeTaken = new Date().getTime() - startTime;
        bulkNumbers.push(i);
        bulkTimes.push(timeTaken/1000);
    }

    const data: Plot[] = [
        {
          x: blockedNumbers,
          y: blockedTimes,
          type: 'scatter',
          name: "Blocking IO Times"
        },
        {
          x: bulkNumbers,
          y: bulkTimes,
          type: 'scatter',
          name: "Non-Blocking IO Times"
        },
      ];
      
      plot(data);
}
createGraphs();