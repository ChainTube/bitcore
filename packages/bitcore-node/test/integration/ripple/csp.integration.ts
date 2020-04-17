import { expect } from 'chai';
import { FormattedTransactionType } from 'ripple-lib/dist/npm/transaction/types';
import { XRP } from '../../../src/modules/ripple/api/csp';
import { XrpBlockStorage } from '../../../src/modules/ripple/models/block';
import { IXrpTransaction } from '../../../src/modules/ripple/types';
import { RippleTxs } from '../../fixtures/rippletxs.fixture';
const chain = 'XRP';
const network = 'testnet';

describe.only('Ripple Api', () => {
  it('should be able to get the ledger', async () => {
    const client = await XRP.getClient(network);
    const ledger = await client.getLedger();
    expect(ledger).to.exist;
    expect(ledger.ledgerHash).to.exist;
  });

  it('should be able to get local tip', async () => {
    await XrpBlockStorage.collection.insertOne({
      chain,
      network,
      height: 5,
      hash: '528f01c17829622ed6a4af51b3b3f6c062f304fa60e66499c9cbb8622c8407f7',
      time: new Date(1526326784),
      timeNormalized: new Date(1526326784),
      transactionCount: 1,
      reward: 50,
      previousBlockHash: '64bfb3eda276ae4ae5b64d9e36c9c0b629bc767fb7ae66f9d55d2c5c8103a929',
      nextBlockHash: '',
      size: 264,
      processed: true
    });

    const tip = await XRP.getLocalTip({ chain, network });
    expect(tip).to.exist;
    expect(tip.hash).to.exist;
    expect(tip.hash).to.eq('528f01c17829622ed6a4af51b3b3f6c062f304fa60e66499c9cbb8622c8407f7');
  });

  it('should transform a ripple rpc response into a bitcore transaction', async () => {
    const txs = (RippleTxs as any) as Array<FormattedTransactionType>;
    for (const tx of txs) {
      const bitcoreTx = (await XRP.transform(tx, 'mainnet')) as IXrpTransaction;
      expect(bitcoreTx).to.have.property('chain');
      expect(tx.address).to.eq(bitcoreTx.from);
      expect(tx.outcome.ledgerVersion).to.eq(bitcoreTx.blockHeight);
      expect(tx.outcome.fee).to.eq((bitcoreTx.fee / 1e6).toString());
      expect(Number(tx.outcome.balanceChanges[bitcoreTx.from][0].value)).to.be.lt(0);
      if (tx.outcome.deliveredAmount) {
        expect(Object.keys(tx.outcome.balanceChanges)).to.contain(bitcoreTx.to!);
        expect(tx.outcome.deliveredAmount!.value).to.eq((bitcoreTx.value / 1e6).toString());
        expect(Number(tx.outcome.balanceChanges[bitcoreTx.to!][0].value)).to.be.gt(0);
      }
    }
  });
});
