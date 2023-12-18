import React, { Component, useState } from 'react';
import fetch from 'node-fetch';
import styled from 'styled-components';
import NumberFormat from 'react-number-format';
import Footer from '../components/Footer';
import { Flex, Box } from 'reflexbox/styled-components';
import { typography, space } from 'styled-system';
import SignatureForm from '../components/SignatureForm';
import Updates from '../components/Updates';
import Notification from '../components/Notification';
import SignatureEmailSent from '../components/SignatureEmailSent';
import Signatures from '../components/Signatures';
import SignaturesCount from '../components/SignaturesCount';
import LocaleSelector from '../components/LocaleSelector';
import { withIntl } from '../lib/i18n';
import moment from 'moment';
import Head from 'next/head';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import Link from 'next/link';

const Page = styled.div`
  max-width: 960px;
  margin: 0 auto;
`;

const Title = styled.h1`
  margin-top: 0px;
  font-size: 50px;
  ${typography}
  line-height: 1.2;
  color: black;
  @media (prefers-color-scheme: dark) {
    color: white;
  }
`;

const Text = styled.div`
  max-width: 80ex;
`;

const ViewMore = styled.div`
  text-align: center;
`;

const IMG = styled.img`
  max-width: 100%;
`;

class Letter extends Component {
  constructor(props) {
    super(props);
    this.state = { status: null };

    this.submitSignature = this.submitSignature.bind(this);
  }

  componentDidMount() {
    if (document.referrer.match(/\/confirm_signature\?token=/)) {
      this.setState({ status: 'confirmed' });
    }
    if (document.referrer.match(/\/create/)) {
      this.setState({ status: 'created' });
    }
  }

  async submitSignature(signature) {
    console.log('>>> submitting ', signature, 'headers', this.props.headers);
    const apiCall = `${process.env.API_URL}/letters/${this.props.letter.slug}/${this.props.letter.locale}/sign`;

    const res = await fetch(apiCall, {
      method: 'post',
      body: JSON.stringify(signature),
      headers: { 'Content-Type': 'application/json', 'accept-language': this.props.headers['accept-language'] },
    });
    const json = await res.json();
    if (json.error) {
      this.setState({ status: 'error', error: json.error });
    } else {
      this.setState({ status: 'signature_sent' });
    }
  }

  render() {
    const { letter, error, t } = this.props;
    const { status } = this.state;
    if (error) {
      return (
        <Page>
          <Notification title="No letter found" />
        </Page>
      );
    } else if (!letter) {
      return (
        <Page>
          <Notification title="Loading..." />
        </Page>
      );
    }

    return (
      <div>
        <Head>
          <title>{letter.title}</title>
          <link rel="shortcut icon" href="/images/openletter-icon.png" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
          {letter.image && (
            <>
              <meta name="twitter:card" content="summary_large_image" />
              <meta name="twitter:image" content={letter.image} />
              <meta property="og:image" content={letter.image} />
            </>
          )}
        </Head>
        <Page className="letter">
          {status === 'created' && (
            <Notification
              icon="signed"
              title={t('notification.published')}
              message={t('notification.published.info')}
            />
          )}
          {status === 'confirmed' && (
            <Notification icon="signed" title={t('notification.signed')} message={t('notification.signed.info')} />
          )}
          <Flex flexWrap="wrap">
            <Box width={[1, 2 / 3]} p={3}>
              <LocaleSelector slug={letter.slug} locales={letter.locales} currentLocale={letter.locale} />
              <strong>{moment(letter.created_at).format('D MMMM YYYY')}</strong>
              <Title fontSize={[2, 2, 3]}>{letter.title}</Title>
              {letter.image && <IMG src={letter.image} />}
              {letter.text && letter.text != 'null' && (
                <Text>
                  <ReactMarkdown plugins={[gfm]} allowDangerousHtml={true}>
                    {letter.text}
                  </ReactMarkdown>
                </Text>
              )}
              <Updates updates={letter.updates} />
            </Box>
            {letter.type === 'letter' && (
              <Box width={[1, 1 / 3]} p={3}>
                <SignaturesCount signatures={letter.signatures} stats={letter.signatures_stats} />
                {[null, 'created', 'error'].includes(status) && (
                  <SignatureForm
                    letter={letter}
                    error={this.state.error}
                    onSubmit={(signature) => this.submitSignature(signature)}
                  />
                )}
                {status === 'signature_sent' && <SignatureEmailSent />}
                {(letter.signatures_stats.verified <= 100 || !letter.first_verified_signatures) && (
                  <Signatures signatures={letter.signatures} />
                )}
                {letter.signatures_stats.verified > 100 && letter.first_verified_signatures && (
                  <>
                    <Signatures
                      signatures={letter.first_verified_signatures}
                      latest={letter.latest_verified_signatures}
                    />
                    <ViewMore className="my-4">
                      <div>
                        ...
                        <br />
                        <NumberFormat
                          value={
                            letter.signatures_stats.verified -
                            letter.first_verified_signatures.length -
                            letter.latest_verified_signatures.length
                          }
                          displayType={'text'}
                          thousandSeparator={true}
                        />{' '}
                        {t('signatures.more')} <br />
                        {t('signatures.verified')}
                      </div>
                      <div>
                        <Link href={`/${letter.slug}/${letter.locale}?limit=0`}>view all</Link>
                      </div>
                    </ViewMore>
                    <Signatures
                      start={letter.signatures_stats.verified - letter.latest_verified_signatures.length + 1}
                      signatures={letter.latest_verified_signatures}
                    />
                  </>
                )}
              </Box>
            )}
          </Flex>
          <Footer />
        </Page>
      </div>
    );
  }
}

export async function getServerSideProps({ params, req, res }) {
  // we cannot cache otherwise the locale shown will be the last one cached
  // res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
  // res.setHeader('Vary', 'Accept-Language');

  const props = { headers: req.headers };
  const apiCall = `${process.env.API_URL}/letters/${params.slug}`;
  const result = await fetch(apiCall, { headers: { 'accept-language': req.headers['accept-language'] } });

  try {
    const response = await result.json();
    if (response.error) {
      props.error = response.error;
    } else {
      props.letter = response;
    }

    // if there are multiples locales, we make sure we redirect to the right locale url
    if (response.locales && response.locales.length > 1) {
      return { redirect: { destination: `/${response.slug}/${response.locale}` } };
    }

    // if there is only one locale, it's safe to cache
    res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return { props };
  } catch (e) {
    console.error('Unable to parse JSON returned by the API', e);
  }
}

export default withIntl(Letter);
