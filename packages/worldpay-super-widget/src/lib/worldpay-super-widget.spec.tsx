import { render } from '@testing-library/react';

import { WorldpaySuperWidget } from './worldpay-super-widget';

describe('WorldpaySuperWidget', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<WorldpaySuperWidget />);
    expect(baseElement).toBeTruthy();
  });
});
