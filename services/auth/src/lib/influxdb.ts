import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { config } from '../config/config';

const { token, url, org, bucket } = config.influxdb;

const client = new InfluxDB({ url, token });

export const getInfluxDBClient = () => client;

export const writeClient = client.getWriteApi(org, bucket, 'ns');

export const queryClient = client.getQueryApi(org);

let fluxQuery = `from(bucket: "test-bucket")
|> range(start: -50m)
|> filter(fn: (r) => r._measurement == "measurement1")`;

export const writeTestData = async () => {
  for (let i = 0; i < 5; i++) {
    const point = new Point('measurement1').tag('tagname1', 'tagvalue1').intField('field1', i);

    void setTimeout(() => {
      writeClient.writePoint(point);
    }, i * 1000); // separate points by 1 second

    void setTimeout(async () => {
      await writeClient.flush();
    }, 5000);
  }
};

export const queryTestData = async () => {
  queryClient.queryRows(fluxQuery, {
    next: (row, tableMeta) => {
      const tableObject = tableMeta.toObject(row);
      console.table(tableObject);
    },
    error: (error) => {
      console.error('\nError', error);
    },
    complete: () => {
      console.log('\nSuccess');
    },
  });
};

export const queryTestDataAggregate = async () => {
  fluxQuery = `from(bucket: "test-bucket")
  |> range(start: -50m)
  |> filter(fn: (r) => r._measurement == "measurement1")
  |> mean()`;

  queryClient.queryRows(fluxQuery, {
    next: (row, tableMeta) => {
      const tableObject = tableMeta.toObject(row);
      console.table(tableObject);
    },
    error: (error) => {
      console.error('\nError', error);
    },
    complete: () => {
      console.log('\nSuccess');
    },
  });
};
