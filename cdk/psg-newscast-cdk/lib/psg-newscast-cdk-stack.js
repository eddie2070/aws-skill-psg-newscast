const cdk = require('@aws-cdk/core');
const psgnewscast_service = require('../lib/psgnewscast_service');


class PsgNewscastCdkStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    // The code that defines your stack goes here
    new psgnewscast_service.psgService(this, 'PSGNewscast');
  }
}

module.exports = { PsgNewscastCdkStack }
