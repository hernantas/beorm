import 'dotenv/config'
import { DataSource } from './data-source'
import { getEnvironment } from './util/environment'

describe('Data Source', () => {
  const { CLIENT, HOST, PORT, USER, PASSWORD, DATABASE } = getEnvironment()
  it('Data source with valid options should make connection', () => {
    expect(
      () =>
        new DataSource({
          client: CLIENT,
          host: HOST,
          port: PORT,
          user: USER,
          password: PASSWORD,
          database: DATABASE,
        }),
    ).not.toThrow()
  })
})
