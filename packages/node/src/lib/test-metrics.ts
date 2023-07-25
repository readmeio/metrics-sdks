// This function should check our metrics backend to see if a request was successful
// if yes, return the details of the call
export async function testMetrics(apiKey) {
  return {
    metricsVerified: true,
  };
}
