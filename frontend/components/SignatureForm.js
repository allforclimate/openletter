import React, { Component } from 'react';
import { Flex, Box } from 'reflexbox/styled-components';
import styled from 'styled-components';
import { withIntl } from '../lib/i18n';
import { Label, Checkbox } from '@rebass/forms';
import { letterSpacing } from 'styled-system';

const SignatureInput = styled.input`
  border: 1px dotted grey;
  font-size: 24pt;
  border-radius: 5px;
  padding: 10px;
  font-family: 'SignPainter';
  box-sizing: border-box;
  width: 100%;
`;

const StyledInput = styled.input`
  border: 1px dotted grey;
  font-size: 12pt;
  border-radius: 5px;
  padding: 10px;
  font-family: 'Arial';
  box-sizing: border-box;
  width: 100%;
`;

const StyledButton = styled.button`
  font-size: 12pt;
  font-family: 'Arial';
  background: #111;
  color: white;
  padding: 10px;
  border-radius: 5px;
  box-sizing: border-box;
  width: 100%;
  &[disabled] {
    background: #999;
  }
  @media (prefers-color-scheme: dark) {
    border: 1px solid white;
    color: #f0f0f0;
    background: #333;
  }
`;

const StyledLabeL = styled.label`
  @media (prefers-color-scheme: dark) {
    color: #aaa;
  }
`;

const Error = styled.div`
  color: red;
  font-weight: bold;
  text-align: center;
  margin: 18px;
`;

const Input = ({ type, name, placeholder, onChange, ...rest }) => (
  <StyledInput
    type={type || 'text'}
    id={name}
    placeholder={placeholder || name}
    onChange={(e) => onChange(name, e.target.value)}
    {...rest}
  />
);

class SignatureForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      form: {
        name: null,
        occupation: null,
        city: null,
        email: null,
        share_email: false,
      },
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(fieldname, value) {
    const { form } = this.state;
    form[fieldname] = value;
    this.setState({ form });
  }

  async handleSubmit(event) {
    this.setState({ loading: true });
    event.preventDefault();
    await this.props.onSubmit(this.state.form);

    // just in case
    setTimeout(() => {
      this.setState({ loading: false });
    }, 2000);
    return false;
  }

  render() {
    const { error, t, letter } = this.props;
    return (
      <form onSubmit={this.handleSubmit}>
        <Flex flexWrap="wrap">
          <Box my={[1 / 2, 1, 1]} width={1}>
            <SignatureInput
              type="text"
              id="name"
              placeholder={t('sign.name')}
              onChange={(e) => this.handleChange('name', e.target.value)}
            />
          </Box>
          <Flex my={[1 / 2, 1, 1]}>
            <Box width={1 / 2} mr={1}>
              <Input name="occupation" placeholder={t('sign.occupation')} onChange={this.handleChange} />
            </Box>
            <Box width={1 / 2}>
              <Input name="city" placeholder={t('sign.city')} onChange={this.handleChange} />
            </Box>
          </Flex>
          <Box my={[1 / 2, 1, 1]} width={1}>
            <Input name="organization" placeholder={t('sign.organization')} onChange={this.handleChange} />
          </Box>
          <Box my={[1 / 2, 1, 1]} width={1}>
            <Input type="email" name="email" placeholder={t('sign.email')} onChange={this.handleChange} required />
          </Box>
          {letter.user_id && (
            <Box my={1}>
              <Label>
                <Box mt={1} mr={[2, 3, 3]}>
                  <Checkbox
                    id="share_email"
                    name="share_email"
                    onChange={(e) => this.handleChange('share_email', e.target.checked)}
                  />
                </Box>
                <StyledLabeL>{t('sign.share_email')}</StyledLabeL>
              </Label>
            </Box>
          )}
        </Flex>
        <Box my={2} width={1}>
          <StyledButton disabled={this.state.loading}>{t('sign.button')}</StyledButton>
        </Box>
        {error && <Error>{error.message}</Error>}
      </form>
    );
  }
}

export default withIntl(SignatureForm);
