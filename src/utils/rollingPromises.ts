export type RollOutput<OutputType, ErrorType> = {
  response?: OutputType;
  isError?: boolean;
  error?: ErrorType;
}

type PromiseCreator<InputType, OutputType> = (input: InputType, count?: number) => Promise<OutputType>;

// This function effectively gets a batch of promises to process. It then sets up a buffer
// of concurrent promise requests and flushes those requests through until all promises have
// been resolved or errored.
export async function rollPromises<InputType, OutputType, ErrorType>
(promiseInputs: InputType[],
  promiseCreator: PromiseCreator<InputType, OutputType>,
  maxRequests: number = parseInt(process.env.MAX_CONCURRENT_ROLLING_REQUESTS!),
  maxPPM: number = parseInt(process.env.MAX_PROMISES_PER_MINUTE!)
): Promise<RollOutput<OutputType, ErrorType>[]> {
  let activeRequests = 0;
  let count = 0;
  let promisesPerMinute = 0;
  const startTime = Date.now();
  const outputs: RollOutput<OutputType, ErrorType>[] = [];
  const isDone = new Promise(resolve => {
    const fillQueueUntilDone = () => {
      if (activeRequests === 0 && count === promiseInputs.length) {
        resolve(true);
      } else {
        let currentTime = Date.now();
        let secondsPassed = (currentTime - startTime) / 1000;
        promisesPerMinute = (count / secondsPassed) * 60;
        while (
          activeRequests < maxRequests &&
          promisesPerMinute < maxPPM &&
          count < promiseInputs.length) {
          const input = promiseInputs[count];
          const output: RollOutput<OutputType, ErrorType> = {};
          outputs.push(output);
          promiseCreator(input, count).then((response: OutputType) => {
            output.response = response;
            activeRequests--;
          }).catch((error: ErrorType) => {
            console.dir({ error })
            output.isError = true;
            output.error = error;
            activeRequests--;
          });
          count++;
          console.log(`Promise ${count} initiated...`);
          activeRequests++;
          currentTime = Date.now();
          secondsPassed = (currentTime - startTime) / 1000;
          promisesPerMinute = (count / secondsPassed) * 60;
        }
        setTimeout(fillQueueUntilDone, 0);
      }
    }
    fillQueueUntilDone();
  });
  await isDone;
  return outputs;
}
