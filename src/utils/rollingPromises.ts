export type RollOutput<OutputType, ErrorType> = {
  response?: OutputType;
  isError?: boolean;
  error?: ErrorType;
}

type PromiseCreator<InputType, OutputType> = (input: InputType) => Promise<OutputType>;

// This function effectively gets a batch of promises to process. It then sets up a buffer
// of concurrent promise requests and flushes those requests through until all promises have
// been resolved or errored.
export async function rollPromises <InputType, OutputType, ErrorType>
(promiseInputs: InputType[], promiseCreator: PromiseCreator<InputType, OutputType>): Promise<RollOutput<OutputType, ErrorType>[]> {
    let activeRequests = 0;
    let count = 0;
    const outputs: RollOutput<OutputType, ErrorType>[] = [];
    const isDone = new Promise(resolve => {
      const fillQueueUntilDone = () => {
        if (activeRequests === 0 && count === promiseInputs.length) {
          resolve(true);
        } else {
          while (activeRequests < parseInt(process.env.MAX_CONCURRENT_ROLLING_REQUESTS!) && count < promiseInputs.length) {
            const input = promiseInputs[count];
            const output: RollOutput<OutputType, ErrorType> = {};
            outputs.push(output);
            promiseCreator(input).then((response: OutputType) => {
              output.response = response;
              activeRequests--;
            }).catch((error: ErrorType) => {
              console.dir({ error })
              output.isError = true;
              output.error = error;
              activeRequests--;
            });
            count++;
            activeRequests++;
          }
          setTimeout(fillQueueUntilDone, 0);
        }
      }
      fillQueueUntilDone();
    });
    await isDone;
    return outputs;
  }
